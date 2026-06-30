import {
  and,
  desc,
  eq,
  getTableColumns,
  isNull,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { accounts, activityEvents, opportunities } from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import { STAGE_META, type OppStageKey } from "./labels";
import type { OpportunityInput } from "./schema";

const toNum = (v: number | undefined) => (v == null ? null : String(v));

function mapInput(input: OpportunityInput, fallbackProbability: number) {
  return {
    name: input.name,
    stage: input.stage,
    probability: input.probability ?? fallbackProbability,
    value: toNum(input.value),
    projectType: input.projectType,
    accountId: input.accountId ?? null,
    expectedCloseDate: input.expectedCloseDate ?? null,
    consultantApproval: input.consultantApproval,
    contractorApproval: input.contractorApproval,
    competitor: input.competitor,
    notes: input.notes,
  };
}

export async function listOpportunitiesForBoard(ctx: AuthContext) {
  requirePermission(ctx, "opportunity.read");
  const conds: SQL[] = [
    eq(opportunities.orgId, ctx.orgId),
    isNull(opportunities.deletedAt),
  ];
  if (scopeOf(ctx, "opportunity.read") === "own")
    conds.push(eq(opportunities.ownerId, ctx.userId));
  return db
    .select({ ...getTableColumns(opportunities), accountName: accounts.name })
    .from(opportunities)
    .leftJoin(accounts, eq(accounts.id, opportunities.accountId))
    .where(and(...conds))
    .orderBy(desc(opportunities.updatedAt))
    .limit(500);
}

export async function getOpportunity(ctx: AuthContext, id: string) {
  requirePermission(ctx, "opportunity.read");
  const [opp] = await db
    .select({ ...getTableColumns(opportunities), accountName: accounts.name })
    .from(opportunities)
    .leftJoin(accounts, eq(accounts.id, opportunities.accountId))
    .where(
      and(
        eq(opportunities.id, id),
        eq(opportunities.orgId, ctx.orgId),
        isNull(opportunities.deletedAt),
      ),
    )
    .limit(1);
  if (!opp) return null;
  if (scopeOf(ctx, "opportunity.read") === "own" && opp.ownerId !== ctx.userId)
    return null;
  return opp;
}

export async function opportunityActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "opportunity"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}

export async function createOpportunity(
  ctx: AuthContext,
  input: OpportunityInput,
) {
  requirePermission(ctx, "opportunity.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "opportunity");
    const [opp] = await tx
      .insert(opportunities)
      .values({
        ...mapInput(input, STAGE_META[input.stage].probability),
        orgId: ctx.orgId,
        refNo: formatted,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "opportunity",
      subjectId: opp.id,
      type: "created",
      actorId: ctx.userId,
      payload: { ref: opp.refNo },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "opportunity.create",
      resource: "opportunity",
      resourceId: opp.id,
      after: opp,
    });
    return opp;
  });
}

export async function updateOpportunity(
  ctx: AuthContext,
  id: string,
  input: OpportunityInput,
) {
  requirePermission(ctx, "opportunity.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Opportunity not found");
    const [after] = await tx
      .update(opportunities)
      .set({
        ...mapInput(input, before.probability),
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "opportunity",
      subjectId: id,
      type: "updated",
      actorId: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "opportunity.update",
      resource: "opportunity",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

/** Move an opportunity to a new pipeline stage (kanban drag, or detail action). */
export async function updateStage(
  ctx: AuthContext,
  id: string,
  stage: OppStageKey,
) {
  requirePermission(ctx, "opportunity.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Opportunity not found");
    if (before.stage === stage) return before;

    const terminal = stage === "won" || stage === "lost";
    const [after] = await tx
      .update(opportunities)
      .set({
        stage,
        probability: STAGE_META[stage].probability,
        closedAt: terminal ? new Date() : null,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "opportunity",
      subjectId: id,
      type: "stage_change",
      actorId: ctx.userId,
      payload: { from: before.stage, to: stage },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "opportunity.stage",
      resource: "opportunity",
      resourceId: id,
      before: { stage: before.stage },
      after: { stage },
      metadata: { from: before.stage, to: stage },
    });
    return after;
  });
}

export async function softDeleteOpportunity(ctx: AuthContext, id: string) {
  requirePermission(ctx, "opportunity.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Opportunity not found");
    await tx
      .update(opportunities)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(opportunities.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "opportunity.delete",
      resource: "opportunity",
      resourceId: id,
      before,
    });
  });
}
