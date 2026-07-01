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
  contracts,
  serviceTickets,
} from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import { SLA_TARGETS } from "./labels";
import type { ResolveInput, TicketInput } from "./schema";
import type { TicketStatusKey } from "./labels";

export interface TicketFilters {
  q?: string;
  status?: string;
  priority?: string;
}

export async function listTickets(
  ctx: AuthContext,
  filters: TicketFilters = {},
) {
  requirePermission(ctx, "ticket.read");
  const conds: SQL[] = [
    eq(serviceTickets.orgId, ctx.orgId),
    isNull(serviceTickets.deletedAt),
  ];
  if (scopeOf(ctx, "ticket.read") === "own")
    conds.push(eq(serviceTickets.assignedTo, ctx.userId));
  if (filters.status)
    conds.push(
      eq(serviceTickets.status, filters.status as TicketStatusKey),
    );
  if (filters.priority)
    conds.push(
      eq(serviceTickets.priority, filters.priority as TicketInput["priority"]),
    );
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(
        ilike(serviceTickets.title, term),
        ilike(serviceTickets.number, term),
      ) as SQL,
    );
  }
  return db
    .select({ ...getTableColumns(serviceTickets), accountName: accounts.name })
    .from(serviceTickets)
    .leftJoin(accounts, eq(accounts.id, serviceTickets.accountId))
    .where(and(...conds))
    .orderBy(desc(serviceTickets.openedAt))
    .limit(300);
}

export async function getTicketFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "ticket.read");
  const [ticket] = await db
    .select({
      ...getTableColumns(serviceTickets),
      accountName: accounts.name,
      contractNumber: contracts.number,
    })
    .from(serviceTickets)
    .leftJoin(accounts, eq(accounts.id, serviceTickets.accountId))
    .leftJoin(contracts, eq(contracts.id, serviceTickets.contractId))
    .where(
      and(
        eq(serviceTickets.id, id),
        eq(serviceTickets.orgId, ctx.orgId),
        isNull(serviceTickets.deletedAt),
      ),
    )
    .limit(1);
  if (!ticket) return null;
  return ticket;
}

export async function createTicket(ctx: AuthContext, input: TicketInput) {
  requirePermission(ctx, "ticket.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "ticket");
    const sla = SLA_TARGETS[input.priority];
    const openedAt = new Date();
    const slaDueAt = new Date(openedAt.getTime() + sla.resolveMins * 60_000);
    const [ticket] = await tx
      .insert(serviceTickets)
      .values({
        orgId: ctx.orgId,
        number: formatted,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        status: "open",
        accountId: input.accountId ?? null,
        contractId: input.contractId ?? null,
        slaResponseMins: sla.responseMins,
        slaResolveMins: sla.resolveMins,
        slaDueAt,
        openedAt,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "ticket",
      subjectId: ticket.id,
      type: "created",
      actorId: ctx.userId,
      payload: { number: ticket.number, priority: ticket.priority },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ticket.create",
      resource: "ticket",
      resourceId: ticket.id,
      after: ticket,
    });
    return ticket;
  });
}

/** Self-dispatch: assign the ticket to the acting user. */
export async function assignTicket(ctx: AuthContext, id: string) {
  requirePermission(ctx, "ticket.assign");
  return db.transaction(async (tx) => {
    const [t] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, id), eq(serviceTickets.orgId, ctx.orgId)))
      .limit(1);
    if (!t) throw new Error("Ticket not found");
    await tx
      .update(serviceTickets)
      .set({
        assignedTo: ctx.userId,
        status: t.status === "open" ? "assigned" : t.status,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(serviceTickets.id, id));
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "ticket",
      subjectId: id,
      type: "assigned",
      actorId: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ticket.assign",
      resource: "ticket",
      resourceId: id,
      after: { assignedTo: ctx.userId },
    });
  });
}

export async function setTicketStatus(
  ctx: AuthContext,
  id: string,
  status: TicketStatusKey,
) {
  requirePermission(ctx, "ticket.update");
  return db.transaction(async (tx) => {
    const [t] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, id), eq(serviceTickets.orgId, ctx.orgId)))
      .limit(1);
    if (!t) throw new Error("Ticket not found");
    await tx
      .update(serviceTickets)
      .set({
        status,
        resolvedAt:
          status === "resolved" || status === "closed"
            ? (t.resolvedAt ?? new Date())
            : null,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(serviceTickets.id, id));
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "ticket",
      subjectId: id,
      type: "status_change",
      actorId: ctx.userId,
      payload: { from: t.status, to: status },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ticket.status",
      resource: "ticket",
      resourceId: id,
      before: { status: t.status },
      after: { status },
    });
  });
}

export async function resolveTicket(
  ctx: AuthContext,
  id: string,
  input: ResolveInput,
) {
  requirePermission(ctx, "ticket.update");
  return db.transaction(async (tx) => {
    const [t] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, id), eq(serviceTickets.orgId, ctx.orgId)))
      .limit(1);
    if (!t) throw new Error("Ticket not found");
    await tx
      .update(serviceTickets)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolution: input.resolution,
        csat: input.csat ?? null,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(serviceTickets.id, id));
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "ticket",
      subjectId: id,
      type: "resolved",
      actorId: ctx.userId,
      payload: { csat: input.csat ?? null },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ticket.resolve",
      resource: "ticket",
      resourceId: id,
      after: { resolution: input.resolution, csat: input.csat ?? null },
    });
  });
}

export async function softDeleteTicket(ctx: AuthContext, id: string) {
  requirePermission(ctx, "ticket.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, id), eq(serviceTickets.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Ticket not found");
    await tx
      .update(serviceTickets)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(serviceTickets.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ticket.delete",
      resource: "ticket",
      resourceId: id,
      before,
    });
  });
}

export async function ticketActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "ticket"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}
