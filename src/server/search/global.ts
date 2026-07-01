/**
 * Global search — org-scoped, permission-filtered lookups across all modules.
 * Each entity group is only queried when the caller holds its read permission,
 * so results never leak records the user couldn't open.
 */
import { and, eq, ilike, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  accounts,
  contracts,
  leads,
  opportunities,
  products,
  projects,
  quotations,
  serviceTickets,
} from "@/db/schema";
import { can, type AuthContext } from "@/server/rbac/guard";

export interface SearchHit {
  label: string;
  sub: string;
  href: string;
}

export interface SearchGroup {
  group: string;
  hits: SearchHit[];
}

const LIMIT = 5;

export async function globalSearch(
  ctx: AuthContext,
  q: string,
): Promise<SearchGroup[]> {
  const term = `%${q}%`;
  const groups: SearchGroup[] = [];

  const tasks: Promise<void>[] = [];

  const push = (group: string, hits: SearchHit[]) => {
    if (hits.length) groups.push({ group, hits });
  };

  if (can(ctx, "account.read")) {
    tasks.push(
      db
        .select({ id: accounts.id, name: accounts.name, type: accounts.type })
        .from(accounts)
        .where(
          and(
            eq(accounts.orgId, ctx.orgId),
            isNull(accounts.deletedAt),
            ilike(accounts.name, term),
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Accounts",
            rows.map((r) => ({
              label: r.name,
              sub: r.type,
              href: `/accounts/${r.id}`,
            })),
          ),
        ),
    );
  }

  if (can(ctx, "lead.read")) {
    tasks.push(
      db
        .select({
          id: leads.id,
          refNo: leads.refNo,
          projectName: leads.projectName,
        })
        .from(leads)
        .where(
          and(
            eq(leads.orgId, ctx.orgId),
            isNull(leads.deletedAt),
            or(
              ilike(leads.refNo, term),
              ilike(leads.projectName, term),
            ) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Leads",
            rows.map((r) => ({
              label: r.projectName,
              sub: r.refNo,
              href: `/leads/${r.id}`,
            })),
          ),
        ),
    );
  }

  if (can(ctx, "opportunity.read")) {
    tasks.push(
      db
        .select({
          id: opportunities.id,
          refNo: opportunities.refNo,
          name: opportunities.name,
        })
        .from(opportunities)
        .where(
          and(
            eq(opportunities.orgId, ctx.orgId),
            isNull(opportunities.deletedAt),
            or(
              ilike(opportunities.refNo, term),
              ilike(opportunities.name, term),
            ) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Opportunities",
            rows.map((r) => ({
              label: r.name,
              sub: r.refNo,
              href: `/opportunities/${r.id}`,
            })),
          ),
        ),
    );
  }

  if (can(ctx, "quotation.read")) {
    tasks.push(
      db
        .select({
          id: quotations.id,
          number: quotations.number,
          title: quotations.title,
        })
        .from(quotations)
        .where(
          and(
            eq(quotations.orgId, ctx.orgId),
            isNull(quotations.deletedAt),
            or(
              ilike(quotations.number, term),
              ilike(quotations.title, term),
            ) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Quotations",
            rows.map((r) => ({
              label: r.title,
              sub: r.number,
              href: `/quotations/${r.id}`,
            })),
          ),
        ),
    );
  }

  if (can(ctx, "project.read")) {
    tasks.push(
      db
        .select({ id: projects.id, code: projects.code, name: projects.name })
        .from(projects)
        .where(
          and(
            eq(projects.orgId, ctx.orgId),
            isNull(projects.deletedAt),
            or(ilike(projects.code, term), ilike(projects.name, term)) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Projects",
            rows.map((r) => ({
              label: r.name,
              sub: r.code,
              href: `/projects/${r.id}`,
            })),
          ),
        ),
    );
  }

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
            eq(contracts.orgId, ctx.orgId),
            isNull(contracts.deletedAt),
            or(
              ilike(contracts.number, term),
              ilike(contracts.title, term),
            ) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "AMC & PPM",
            rows.map((r) => ({
              label: r.title,
              sub: r.number,
              href: `/contracts/${r.id}`,
            })),
          ),
        ),
    );
  }

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
            eq(serviceTickets.orgId, ctx.orgId),
            isNull(serviceTickets.deletedAt),
            or(
              ilike(serviceTickets.number, term),
              ilike(serviceTickets.title, term),
            ) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Service tickets",
            rows.map((r) => ({
              label: r.title,
              sub: r.number,
              href: `/service/${r.id}`,
            })),
          ),
        ),
    );
  }

  if (can(ctx, "inventory.read")) {
    tasks.push(
      db
        .select({ id: products.id, sku: products.sku, name: products.name })
        .from(products)
        .where(
          and(
            eq(products.orgId, ctx.orgId),
            isNull(products.deletedAt),
            or(ilike(products.sku, term), ilike(products.name, term)) as SQL,
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          push(
            "Inventory",
            rows.map((r) => ({
              label: r.name,
              sub: r.sku,
              href: `/inventory/${r.id}`,
            })),
          ),
        ),
    );
  }

  await Promise.all(tasks);

  // Stable module ordering regardless of which query resolved first.
  const order = [
    "Accounts",
    "Leads",
    "Opportunities",
    "Quotations",
    "Projects",
    "AMC & PPM",
    "Service tickets",
    "Inventory",
  ];
  return groups.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}
