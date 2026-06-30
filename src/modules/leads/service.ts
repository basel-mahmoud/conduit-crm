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
import { accounts, activityEvents, leads, opportunities } from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import { STAGE_META } from "../opportunities/labels";
import type { LeadInput } from "./schema";

const toNum = (v: number | undefined) => (v == null ? null : String(v));
const toDate = (v: string | undefined) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

function mapInput(input: LeadInput) {
  return {
    source: input.source,
    status: input.status,
    projectType: input.projectType,
    projectName: input.projectName,
    projectLocation: input.projectLocation,
    estValue: toNum(input.estValue),
    accountId: input.accountId ?? null,
    consultantId: input.consultantId ?? null,
    contractorId: input.contractorId ?? null,
    nextFollowUpAt: toDate(input.nextFollowUpAt),
    notes: input.notes,
  };
}

export interface LeadFilters {
  q?: string;
  status?: string;
}

export async function listLeads(ctx: AuthContext, filters: LeadFilters = {}) {
  requirePermission(ctx, "lead.read");
  const conds: SQL[] = [eq(leads.orgId, ctx.orgId), isNull(leads.deletedAt)];
  if (scopeOf(ctx, "lead.read") === "own")
    conds.push(eq(leads.ownerId, ctx.userId));
  if (filters.status)
    conds.push(eq(leads.status, filters.status as LeadInput["status"]));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(ilike(leads.projectName, term), ilike(leads.refNo, term)) as SQL,
    );
  }
  return db
    .select({ ...getTableColumns(leads), accountName: accounts.name })
    .from(leads)
    .leftJoin(accounts, eq(accounts.id, leads.accountId))
    .where(and(...conds))
    .orderBy(desc(leads.createdAt))
    .limit(200);
}

export async function getLead(ctx: AuthContext, id: string) {
  requirePermission(ctx, "lead.read");
  const [lead] = await db
    .select({ ...getTableColumns(leads), accountName: accounts.name })
    .from(leads)
    .leftJoin(accounts, eq(accounts.id, leads.accountId))
    .where(
      and(
        eq(leads.id, id),
        eq(leads.orgId, ctx.orgId),
        isNull(leads.deletedAt),
      ),
    )
    .limit(1);
  if (!lead) return null;
  if (scopeOf(ctx, "lead.read") === "own" && lead.ownerId !== ctx.userId)
    return null;
  return lead;
}

export async function leadActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "lead"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}

export async function createLead(ctx: AuthContext, input: LeadInput) {
  requirePermission(ctx, "lead.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "lead");
    const [lead] = await tx
      .insert(leads)
      .values({
        ...mapInput(input),
        orgId: ctx.orgId,
        refNo: formatted,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "lead",
      subjectId: lead.id,
      type: "created",
      actorId: ctx.userId,
      payload: { ref: lead.refNo },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "lead.create",
      resource: "lead",
      resourceId: lead.id,
      after: lead,
    });
    return lead;
  });
}

export async function updateLead(
  ctx: AuthContext,
  id: string,
  input: LeadInput,
) {
  requirePermission(ctx, "lead.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Lead not found");
    const [after] = await tx
      .update(leads)
      .set({ ...mapInput(input), updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "lead",
      subjectId: id,
      type: "updated",
      actorId: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "lead.update",
      resource: "lead",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

export async function softDeleteLead(ctx: AuthContext, id: string) {
  requirePermission(ctx, "lead.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Lead not found");
    await tx
      .update(leads)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(leads.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "lead.delete",
      resource: "lead",
      resourceId: id,
      before,
    });
  });
}

/** Convert a qualified lead into an opportunity (qualified stage). */
export async function convertLead(ctx: AuthContext, id: string) {
  requirePermission(ctx, "lead.convert");
  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, id),
          eq(leads.orgId, ctx.orgId),
          isNull(leads.deletedAt),
        ),
      )
      .limit(1);
    if (!lead) throw new Error("Lead not found");
    if (lead.convertedOpportunityId) throw new Error("Lead already converted");

    const { formatted } = await allocateNumber(tx, ctx.orgId, "opportunity");
    const [opp] = await tx
      .insert(opportunities)
      .values({
        orgId: ctx.orgId,
        refNo: formatted,
        leadId: lead.id,
        accountId: lead.accountId,
        name: lead.projectName,
        stage: "qualified",
        probability: STAGE_META.qualified.probability,
        value: lead.estValue,
        projectType: lead.projectType,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();

    await tx
      .update(leads)
      .set({
        status: "converted",
        convertedOpportunityId: opp.id,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id));

    await tx.insert(activityEvents).values([
      {
        orgId: ctx.orgId,
        subjectType: "lead",
        subjectId: id,
        type: "converted",
        actorId: ctx.userId,
        payload: { opportunity: opp.refNo },
      },
      {
        orgId: ctx.orgId,
        subjectType: "opportunity",
        subjectId: opp.id,
        type: "created_from_lead",
        actorId: ctx.userId,
        payload: { lead: lead.refNo },
      },
    ]);

    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "lead.convert",
      resource: "lead",
      resourceId: id,
      before: lead,
      after: { status: "converted", convertedOpportunityId: opp.id },
      metadata: { opportunityId: opp.id, opportunityRef: opp.refNo },
    });
    return opp;
  });
}
