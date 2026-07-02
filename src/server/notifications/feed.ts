/**
 * Notification feed — real, permission-scoped alerts derived from live data.
 * Every category is gated by the relevant read permission, so each role only
 * sees notifications for the modules it can access (service engineers see SLA
 * breaches, procurement sees low stock, managers see approvals, etc.).
 */
import { and, asc, eq, isNull, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  contracts,
  discountApprovals,
  products,
  quotations,
  serviceTickets,
} from "@/db/schema";
import { can, type AuthContext } from "@/server/rbac/guard";

export interface Notification {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  sub: string;
  href: string;
}

export async function notificationsFor(
  ctx: AuthContext,
): Promise<Notification[]> {
  const org = ctx.orgId;
  const items: Notification[] = [];
  const tasks: Promise<void>[] = [];

  // Service tickets past their SLA and not yet resolved.
  if (can(ctx, "ticket.read")) {
    tasks.push(
      db
        .select({
          id: serviceTickets.id,
          number: serviceTickets.number,
          title: serviceTickets.title,
        })
        .from(serviceTickets)
        .where(
          and(
            eq(serviceTickets.orgId, org),
            isNull(serviceTickets.deletedAt),
            notInArray(serviceTickets.status, ["resolved", "closed"]),
            sql`${serviceTickets.slaDueAt} is not null and ${serviceTickets.slaDueAt} < now()`,
          ),
        )
        .orderBy(asc(serviceTickets.slaDueAt))
        .limit(8)
        .then((rows) =>
          rows.forEach((r) =>
            items.push({
              id: `ticket-${r.id}`,
              tone: "danger",
              title: `Ticket ${r.number} is past SLA`,
              sub: r.title,
              href: `/service/${r.id}`,
            }),
          ),
        ),
    );
  }

  // Products at or below reorder level.
  if (can(ctx, "inventory.read")) {
    tasks.push(
      db
        .select({ id: products.id, sku: products.sku, name: products.name })
        .from(products)
        .where(
          and(
            eq(products.orgId, org),
            isNull(products.deletedAt),
            sql`${products.stockQty} <= ${products.reorderLevel} and ${products.reorderLevel} > 0`,
          ),
        )
        .orderBy(asc(products.name))
        .limit(8)
        .then((rows) =>
          rows.forEach((r) =>
            items.push({
              id: `stock-${r.id}`,
              tone: "warning",
              title: `${r.name} is low on stock`,
              sub: `${r.sku} · at or below reorder level`,
              href: `/inventory/${r.id}`,
            }),
          ),
        ),
    );
  }

  // Discount approvals awaiting a decision.
  if (can(ctx, "discount.approve")) {
    tasks.push(
      db
        .select({
          id: discountApprovals.id,
          quotationId: discountApprovals.quotationId,
          requestedPct: discountApprovals.requestedPct,
          number: quotations.number,
        })
        .from(discountApprovals)
        .innerJoin(
          quotations,
          eq(quotations.id, discountApprovals.quotationId),
        )
        .where(
          and(
            eq(discountApprovals.orgId, org),
            eq(discountApprovals.status, "pending"),
          ),
        )
        .limit(8)
        .then((rows) =>
          rows.forEach((r) =>
            items.push({
              id: `discount-${r.id}`,
              tone: "info",
              title: `Discount approval needed`,
              sub: `${r.number} · ${Number(r.requestedPct).toFixed(1)}% requested`,
              href: `/quotations/${r.quotationId}`,
            }),
          ),
        ),
    );
  }

  // AMC/PPM contracts due for renewal soon.
  if (can(ctx, "contract.read")) {
    tasks.push(
      db
        .select({
          id: contracts.id,
          number: contracts.number,
          title: contracts.title,
        })
        .from(contracts)
        .where(
          and(
            eq(contracts.orgId, org),
            isNull(contracts.deletedAt),
            eq(contracts.status, "active"),
            sql`${contracts.renewalReminderAt} is not null and ${contracts.renewalReminderAt} <= now() + interval '45 days'`,
          ),
        )
        .limit(8)
        .then((rows) =>
          rows.forEach((r) =>
            items.push({
              id: `contract-${r.id}`,
              tone: "info",
              title: `${r.number} is due for renewal`,
              sub: r.title,
              href: `/contracts/${r.id}`,
            }),
          ),
        ),
    );
  }

  await Promise.all(tasks);

  // Danger first, then warning, then info — most urgent on top.
  const rank = { danger: 0, warning: 1, info: 2 };
  return items.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
