import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  accounts,
  activityEvents,
  discountApprovals,
  opportunities,
  organizations,
  quotationLines,
  quotationRevisions,
  quotations,
} from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import {
  DISCOUNT_APPROVAL_THRESHOLD,
  calcLineTotals,
  calcQuotation,
} from "./calc";
import type { LineInput, SaveRevisionInput } from "./schema";
import type { QuotationStatusKey } from "./labels";

const money = (n: number) => n.toFixed(2);

export interface QuotationFilters {
  q?: string;
  status?: string;
}

export async function listQuotations(
  ctx: AuthContext,
  filters: QuotationFilters = {},
) {
  requirePermission(ctx, "quotation.read");
  const conds: SQL[] = [
    eq(quotations.orgId, ctx.orgId),
    isNull(quotations.deletedAt),
  ];
  if (scopeOf(ctx, "quotation.read") === "own")
    conds.push(eq(quotations.ownerId, ctx.userId));
  if (filters.status)
    conds.push(eq(quotations.status, filters.status as QuotationStatusKey));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(ilike(quotations.number, term), ilike(quotations.title, term)) as SQL,
    );
  }
  return db
    .select({
      ...getTableColumns(quotations),
      accountName: accounts.name,
      grandTotal: quotationRevisions.grandTotal,
      marginPct: quotationRevisions.marginPct,
    })
    .from(quotations)
    .leftJoin(accounts, eq(accounts.id, quotations.accountId))
    .leftJoin(
      quotationRevisions,
      eq(quotationRevisions.id, quotations.currentRevisionId),
    )
    .where(and(...conds))
    .orderBy(desc(quotations.createdAt))
    .limit(200);
}

export async function getQuotationFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "quotation.read");
  const [quotation] = await db
    .select({ ...getTableColumns(quotations), accountName: accounts.name })
    .from(quotations)
    .leftJoin(accounts, eq(accounts.id, quotations.accountId))
    .where(
      and(
        eq(quotations.id, id),
        eq(quotations.orgId, ctx.orgId),
        isNull(quotations.deletedAt),
      ),
    )
    .limit(1);
  if (!quotation) return null;
  if (
    scopeOf(ctx, "quotation.read") === "own" &&
    quotation.ownerId !== ctx.userId
  )
    return null;

  const revisions = await db
    .select({
      id: quotationRevisions.id,
      revNo: quotationRevisions.revNo,
      status: quotationRevisions.status,
      grandTotal: quotationRevisions.grandTotal,
      createdAt: quotationRevisions.createdAt,
    })
    .from(quotationRevisions)
    .where(eq(quotationRevisions.quotationId, id))
    .orderBy(desc(quotationRevisions.revNo));

  const current = quotation.currentRevisionId
    ? (
        await db
          .select()
          .from(quotationRevisions)
          .where(eq(quotationRevisions.id, quotation.currentRevisionId))
          .limit(1)
      )[0]
    : null;

  const lines = current
    ? await db
        .select()
        .from(quotationLines)
        .where(eq(quotationLines.revisionId, current.id))
        .orderBy(quotationLines.sortOrder)
    : [];

  const pendingApproval = current
    ? ((
        await db
          .select()
          .from(discountApprovals)
          .where(
            and(
              eq(discountApprovals.revisionId, current.id),
              eq(discountApprovals.status, "pending"),
            ),
          )
          .limit(1)
      )[0] ?? null)
    : null;

  return { quotation, current, lines, revisions, pendingApproval };
}

async function orgVatRate(orgId: string): Promise<string> {
  const [o] = await db
    .select({ vatRate: organizations.vatRate })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return o?.vatRate ?? "0.0500";
}

export async function createQuotationFromOpportunity(
  ctx: AuthContext,
  opportunityId: string,
) {
  requirePermission(ctx, "quotation.create");
  return db.transaction(async (tx) => {
    const [opp] = await tx
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.id, opportunityId),
          eq(opportunities.orgId, ctx.orgId),
        ),
      )
      .limit(1);
    if (!opp) throw new Error("Opportunity not found");

    const { formatted } = await allocateNumber(tx, ctx.orgId, "quotation");
    const vat = await orgVatRate(ctx.orgId);
    const [q] = await tx
      .insert(quotations)
      .values({
        orgId: ctx.orgId,
        number: formatted,
        title: opp.name,
        opportunityId: opp.id,
        accountId: opp.accountId,
        projectType: opp.projectType,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    const [rev] = await tx
      .insert(quotationRevisions)
      .values({
        orgId: ctx.orgId,
        quotationId: q.id,
        revNo: 0,
        status: "draft",
        vatRate: vat,
        createdBy: ctx.userId,
      })
      .returning();
    await tx
      .update(quotations)
      .set({ currentRevisionId: rev.id })
      .where(eq(quotations.id, q.id));

    await tx.insert(activityEvents).values([
      {
        orgId: ctx.orgId,
        subjectType: "quotation",
        subjectId: q.id,
        type: "created",
        actorId: ctx.userId,
        payload: { number: q.number, fromOpportunity: opp.refNo },
      },
      {
        orgId: ctx.orgId,
        subjectType: "opportunity",
        subjectId: opp.id,
        type: "quotation_created",
        actorId: ctx.userId,
        payload: { number: q.number },
      },
    ]);
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "quotation.create",
      resource: "quotation",
      resourceId: q.id,
      after: q,
    });
    return q;
  });
}

/** Save the BOQ (lines + discount) and recompute all totals. */
export async function saveRevision(
  ctx: AuthContext,
  revisionId: string,
  payload: SaveRevisionInput,
) {
  // Editing the cost build-up inherently exposes cost/margin.
  requirePermission(ctx, "quotation.cost.view");
  requirePermission(ctx, "quotation.update");
  return db.transaction(async (tx) => {
    const [rev] = await tx
      .select()
      .from(quotationRevisions)
      .where(
        and(
          eq(quotationRevisions.id, revisionId),
          eq(quotationRevisions.orgId, ctx.orgId),
        ),
      )
      .limit(1);
    if (!rev) throw new Error("Revision not found");
    if (rev.status === "superseded")
      throw new Error("Cannot edit a superseded revision");

    const calcLines = payload.lines.map((l) => ({
      qty: l.qty,
      materialUnitCost: l.materialUnitCost,
      laborUnitCost: l.laborUnitCost,
      engineeringUnitCost: l.engineeringUnitCost,
      subcontractorUnitCost: l.subcontractorUnitCost,
      markupPct: l.markupPct,
    }));
    const totals = calcQuotation(
      calcLines,
      payload.discountPct,
      Number(rev.vatRate),
    );

    const needsApproval = payload.discountPct > DISCOUNT_APPROVAL_THRESHOLD;
    const discountApproved = !needsApproval;

    await tx
      .delete(quotationLines)
      .where(eq(quotationLines.revisionId, revisionId));
    if (payload.lines.length) {
      await tx.insert(quotationLines).values(
        payload.lines.map((l: LineInput, i: number) => {
          const lt = calcLineTotals(l);
          return {
            orgId: ctx.orgId,
            revisionId,
            sectionTitle: l.sectionTitle,
            sortOrder: i,
            description: l.description,
            qty: String(l.qty),
            unit: l.unit,
            materialUnitCost: money(l.materialUnitCost),
            laborUnitCost: money(l.laborUnitCost),
            engineeringUnitCost: money(l.engineeringUnitCost),
            subcontractorUnitCost: money(l.subcontractorUnitCost),
            markupPct: String(l.markupPct),
            unitPrice: money(lt.unitPrice),
            lineTotal: money(lt.lineTotal),
          };
        }),
      );
    }

    await tx
      .update(quotationRevisions)
      .set({
        discountPct: String(payload.discountPct),
        discountApproved,
        validUntil: payload.validUntil ?? null,
        notes: payload.notes ?? null,
        materialCost: money(totals.materialCost),
        laborCost: money(totals.laborCost),
        engineeringCost: money(totals.engineeringCost),
        subcontractorCost: money(totals.subcontractorCost),
        totalCost: money(totals.totalCost),
        subtotal: money(totals.subtotal),
        discountAmount: money(totals.discountAmount),
        netSubtotal: money(totals.netSubtotal),
        vatAmount: money(totals.vatAmount),
        grandTotal: money(totals.grandTotal),
        marginAmount: money(totals.marginAmount),
        marginPct: money(totals.marginPct),
      })
      .where(eq(quotationRevisions.id, revisionId));

    if (needsApproval) {
      const [pending] = await tx
        .select({ id: discountApprovals.id })
        .from(discountApprovals)
        .where(
          and(
            eq(discountApprovals.revisionId, revisionId),
            eq(discountApprovals.status, "pending"),
          ),
        )
        .limit(1);
      if (!pending) {
        await tx.insert(discountApprovals).values({
          orgId: ctx.orgId,
          quotationId: rev.quotationId,
          revisionId,
          requestedPct: String(payload.discountPct),
          requestedBy: ctx.userId,
          status: "pending",
        });
      }
    }

    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "quotation",
      subjectId: rev.quotationId,
      type: "revision_saved",
      actorId: ctx.userId,
      payload: { rev: rev.revNo, grandTotal: totals.grandTotal },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "quotation.revise",
      resource: "quotation",
      resourceId: rev.quotationId,
      after: {
        rev: rev.revNo,
        grandTotal: totals.grandTotal,
        marginPct: totals.marginPct,
        discountPct: payload.discountPct,
      },
    });
    return totals;
  });
}

export async function newRevision(ctx: AuthContext, quotationId: string) {
  requirePermission(ctx, "quotation.update");
  return db.transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), eq(quotations.orgId, ctx.orgId)))
      .limit(1);
    if (!q || !q.currentRevisionId) throw new Error("Quotation not found");

    const [cur] = await tx
      .select()
      .from(quotationRevisions)
      .where(eq(quotationRevisions.id, q.currentRevisionId))
      .limit(1);
    const curLines = await tx
      .select()
      .from(quotationLines)
      .where(eq(quotationLines.revisionId, cur.id));

    await tx
      .update(quotationRevisions)
      .set({ status: "superseded" })
      .where(eq(quotationRevisions.id, cur.id));

    const [rev] = await tx
      .insert(quotationRevisions)
      .values({
        orgId: ctx.orgId,
        quotationId,
        revNo: cur.revNo + 1,
        status: "draft",
        vatRate: cur.vatRate,
        discountPct: cur.discountPct,
        discountApproved: cur.discountApproved,
        materialCost: cur.materialCost,
        laborCost: cur.laborCost,
        engineeringCost: cur.engineeringCost,
        subcontractorCost: cur.subcontractorCost,
        totalCost: cur.totalCost,
        subtotal: cur.subtotal,
        discountAmount: cur.discountAmount,
        netSubtotal: cur.netSubtotal,
        vatAmount: cur.vatAmount,
        grandTotal: cur.grandTotal,
        marginAmount: cur.marginAmount,
        marginPct: cur.marginPct,
        createdBy: ctx.userId,
      })
      .returning();

    if (curLines.length) {
      await tx.insert(quotationLines).values(
        curLines.map((l) => ({
          orgId: ctx.orgId,
          revisionId: rev.id,
          sectionTitle: l.sectionTitle,
          sortOrder: l.sortOrder,
          description: l.description,
          qty: l.qty,
          unit: l.unit,
          materialUnitCost: l.materialUnitCost,
          laborUnitCost: l.laborUnitCost,
          engineeringUnitCost: l.engineeringUnitCost,
          subcontractorUnitCost: l.subcontractorUnitCost,
          markupPct: l.markupPct,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
      );
    }

    await tx
      .update(quotations)
      .set({
        currentRevisionId: rev.id,
        status: "draft",
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));

    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "quotation",
      subjectId: quotationId,
      type: "revision_created",
      actorId: ctx.userId,
      payload: { rev: rev.revNo },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "quotation.revision",
      resource: "quotation",
      resourceId: quotationId,
      after: { rev: rev.revNo },
    });
    return rev;
  });
}

export async function setQuotationStatus(
  ctx: AuthContext,
  id: string,
  status: QuotationStatusKey,
) {
  requirePermission(ctx, "quotation.update");
  if (status === "sent") requirePermission(ctx, "quotation.send");
  return db.transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, id), eq(quotations.orgId, ctx.orgId)))
      .limit(1);
    if (!q) throw new Error("Quotation not found");

    if ((status === "approved" || status === "sent") && q.currentRevisionId) {
      const [rev] = await tx
        .select({ discountApproved: quotationRevisions.discountApproved })
        .from(quotationRevisions)
        .where(eq(quotationRevisions.id, q.currentRevisionId))
        .limit(1);
      if (rev && !rev.discountApproved) {
        throw new Error("Discount approval pending — cannot approve or send.");
      }
    }

    await tx
      .update(quotations)
      .set({ status, updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(quotations.id, id));
    if (q.currentRevisionId && (status === "approved" || status === "sent")) {
      await tx
        .update(quotationRevisions)
        .set({ status: status === "sent" ? "sent" : "approved" })
        .where(eq(quotationRevisions.id, q.currentRevisionId));
    }

    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "quotation",
      subjectId: id,
      type: "status_change",
      actorId: ctx.userId,
      payload: { from: q.status, to: status },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "quotation.status",
      resource: "quotation",
      resourceId: id,
      before: { status: q.status },
      after: { status },
    });
  });
}

export async function decideDiscount(
  ctx: AuthContext,
  approvalId: string,
  decision: "approved" | "rejected",
  reason?: string,
) {
  requirePermission(ctx, "discount.approve");
  return db.transaction(async (tx) => {
    const [appr] = await tx
      .select()
      .from(discountApprovals)
      .where(
        and(
          eq(discountApprovals.id, approvalId),
          eq(discountApprovals.orgId, ctx.orgId),
        ),
      )
      .limit(1);
    if (!appr) throw new Error("Approval not found");

    await tx
      .update(discountApprovals)
      .set({
        status: decision,
        approverId: ctx.userId,
        reason: reason ?? null,
        decidedAt: new Date(),
      })
      .where(eq(discountApprovals.id, approvalId));
    if (decision === "approved") {
      await tx
        .update(quotationRevisions)
        .set({ discountApproved: true, discountApprovedBy: ctx.userId })
        .where(eq(quotationRevisions.id, appr.revisionId));
    }

    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "quotation",
      subjectId: appr.quotationId,
      type: `discount_${decision}`,
      actorId: ctx.userId,
      payload: { pct: appr.requestedPct },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: `discount.${decision}`,
      resource: "quotation",
      resourceId: appr.quotationId,
      metadata: { approvalId, pct: appr.requestedPct },
    });
  });
}

export async function softDeleteQuotation(ctx: AuthContext, id: string) {
  requirePermission(ctx, "quotation.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, id), eq(quotations.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Quotation not found");
    await tx
      .update(quotations)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(quotations.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "quotation.delete",
      resource: "quotation",
      resourceId: id,
      before,
    });
  });
}

export async function quotationActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "quotation"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}
