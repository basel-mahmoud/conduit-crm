import {
  and,
  asc,
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
  assets,
  contracts,
  ppmVisits,
  projects,
} from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import type { AssetInput, ContractInput, VisitInput } from "./schema";

const toNum = (v: number | undefined) => (v == null ? null : String(v));
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export interface ContractFilters {
  q?: string;
  status?: string;
  type?: string;
}

export async function listContracts(
  ctx: AuthContext,
  filters: ContractFilters = {},
) {
  requirePermission(ctx, "contract.read");
  const conds: SQL[] = [
    eq(contracts.orgId, ctx.orgId),
    isNull(contracts.deletedAt),
  ];
  if (scopeOf(ctx, "contract.read") === "own")
    conds.push(eq(contracts.ownerId, ctx.userId));
  if (filters.status)
    conds.push(eq(contracts.status, filters.status as ContractInput["status"]));
  if (filters.type)
    conds.push(eq(contracts.type, filters.type as ContractInput["type"]));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(ilike(contracts.title, term), ilike(contracts.number, term)) as SQL,
    );
  }
  return db
    .select({ ...getTableColumns(contracts), accountName: accounts.name })
    .from(contracts)
    .leftJoin(accounts, eq(accounts.id, contracts.accountId))
    .where(and(...conds))
    .orderBy(desc(contracts.createdAt))
    .limit(200);
}

export async function listContractOptions(ctx: AuthContext) {
  requirePermission(ctx, "contract.read");
  return db
    .select({ id: contracts.id, number: contracts.number })
    .from(contracts)
    .where(and(eq(contracts.orgId, ctx.orgId), isNull(contracts.deletedAt)))
    .orderBy(desc(contracts.createdAt))
    .limit(300);
}

export async function getContractFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "contract.read");
  const [contract] = await db
    .select({ ...getTableColumns(contracts), accountName: accounts.name })
    .from(contracts)
    .leftJoin(accounts, eq(accounts.id, contracts.accountId))
    .where(
      and(
        eq(contracts.id, id),
        eq(contracts.orgId, ctx.orgId),
        isNull(contracts.deletedAt),
      ),
    )
    .limit(1);
  if (!contract) return null;

  const [contractAssets, visits] = await Promise.all([
    db
      .select()
      .from(assets)
      .where(and(eq(assets.contractId, id), isNull(assets.deletedAt)))
      .orderBy(asc(assets.name)),
    db
      .select()
      .from(ppmVisits)
      .where(eq(ppmVisits.contractId, id))
      .orderBy(asc(ppmVisits.scheduledDate)),
  ]);

  return { contract, assets: contractAssets, visits };
}

function mapContract(input: ContractInput) {
  return {
    title: input.title,
    type: input.type,
    accountId: input.accountId ?? null,
    value: toNum(input.value),
    annualCost: toNum(input.annualCost),
    status: input.status,
    ppmFrequency: input.ppmFrequency ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    renewalReminderAt: input.renewalReminderAt ?? null,
    notes: input.notes,
  };
}

export async function createContract(ctx: AuthContext, input: ContractInput) {
  requirePermission(ctx, "contract.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "contract");
    const [contract] = await tx
      .insert(contracts)
      .values({
        ...mapContract(input),
        orgId: ctx.orgId,
        number: formatted,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "contract",
      subjectId: contract.id,
      type: "created",
      actorId: ctx.userId,
      payload: { number: contract.number },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "contract.create",
      resource: "contract",
      resourceId: contract.id,
      after: contract,
    });
    return contract;
  });
}

export async function createContractFromProject(
  ctx: AuthContext,
  projectId: string,
) {
  requirePermission(ctx, "contract.create");
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)))
      .limit(1);
    if (!project) throw new Error("Project not found");

    const { formatted } = await allocateNumber(tx, ctx.orgId, "contract");
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    const reminder = new Date(end);
    reminder.setDate(reminder.getDate() - 30);

    const [contract] = await tx
      .insert(contracts)
      .values({
        orgId: ctx.orgId,
        number: formatted,
        type: "amc",
        title: `AMC — ${project.name}`,
        accountId: project.accountId,
        projectId: project.id,
        status: "active",
        startDate: isoDate(start),
        endDate: isoDate(end),
        renewalReminderAt: isoDate(reminder),
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "contract",
      subjectId: contract.id,
      type: "created",
      actorId: ctx.userId,
      payload: { number: contract.number, fromProject: project.code },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "contract.create",
      resource: "contract",
      resourceId: contract.id,
      after: contract,
    });
    return contract;
  });
}

export async function updateContract(
  ctx: AuthContext,
  id: string,
  input: ContractInput,
) {
  requirePermission(ctx, "contract.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Contract not found");
    const [after] = await tx
      .update(contracts)
      .set({ ...mapContract(input), updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "contract.update",
      resource: "contract",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

export async function softDeleteContract(ctx: AuthContext, id: string) {
  requirePermission(ctx, "contract.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Contract not found");
    await tx
      .update(contracts)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(contracts.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "contract.delete",
      resource: "contract",
      resourceId: id,
      before,
    });
  });
}

export async function addAsset(
  ctx: AuthContext,
  contractId: string,
  input: AssetInput,
) {
  requirePermission(ctx, "asset.manage");
  return db.transaction(async (tx) => {
    const [contract] = await tx
      .select({ id: contracts.id, accountId: contracts.accountId })
      .from(contracts)
      .where(and(eq(contracts.id, contractId), eq(contracts.orgId, ctx.orgId)))
      .limit(1);
    if (!contract) throw new Error("Contract not found");
    await tx.insert(assets).values({
      orgId: ctx.orgId,
      contractId,
      accountId: contract.accountId,
      name: input.name,
      category: input.category,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNo: input.serialNo,
      location: input.location,
      installDate: input.installDate ?? null,
      warrantyEnd: input.warrantyEnd ?? null,
      status: input.status,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "asset.create",
      resource: "contract",
      resourceId: contractId,
      after: { name: input.name },
    });
  });
}

export async function scheduleVisit(
  ctx: AuthContext,
  contractId: string,
  input: VisitInput,
) {
  requirePermission(ctx, "ppm.schedule");
  return db.transaction(async (tx) => {
    const [contract] = await tx
      .select({ id: contracts.id })
      .from(contracts)
      .where(and(eq(contracts.id, contractId), eq(contracts.orgId, ctx.orgId)))
      .limit(1);
    if (!contract) throw new Error("Contract not found");
    await tx.insert(ppmVisits).values({
      orgId: ctx.orgId,
      contractId,
      scheduledDate: input.scheduledDate,
      status: "planned",
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ppm.schedule",
      resource: "contract",
      resourceId: contractId,
      after: { scheduledDate: input.scheduledDate },
    });
  });
}

export async function completeVisit(ctx: AuthContext, visitId: string) {
  requirePermission(ctx, "ppm.schedule");
  return db.transaction(async (tx) => {
    const [visit] = await tx
      .select()
      .from(ppmVisits)
      .where(and(eq(ppmVisits.id, visitId), eq(ppmVisits.orgId, ctx.orgId)))
      .limit(1);
    if (!visit) throw new Error("Visit not found");
    const done = visit.status !== "completed";
    await tx
      .update(ppmVisits)
      .set({
        status: done ? "completed" : "planned",
        completedAt: done ? new Date() : null,
        technicianId: done ? ctx.userId : null,
      })
      .where(eq(ppmVisits.id, visitId));
  });
}

export async function contractActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "contract"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}
