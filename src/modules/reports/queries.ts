import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  notInArray,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  contracts,
  leads,
  opportunities,
  products,
  projects,
  quotations,
  serviceTickets,
} from "@/db/schema";
import { requirePermission, type AuthContext } from "@/server/rbac/guard";
import { STAGE_META, type OppStageKey } from "@/modules/opportunities/labels";

const n = (v: unknown) => Number(v ?? 0);

export async function dashboardSummary(ctx: AuthContext) {
  const org = ctx.orgId;

  const [
    leadCount,
    openOpps,
    wonAgg,
    quotesActive,
    projActive,
    projDone,
    contractsActive,
    ticketRows,
    lowStock,
    stageRows,
    recent,
    renewalsSoon,
  ] = await Promise.all([
    db.select({ c: count() }).from(leads).where(and(eq(leads.orgId, org), isNull(leads.deletedAt))),
    db
      .select({ value: opportunities.value, probability: opportunities.probability })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.orgId, org),
          isNull(opportunities.deletedAt),
          notInArray(opportunities.stage, ["won", "lost"]),
        ),
      ),
    db
      .select({ c: count(), v: sum(opportunities.value) })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.orgId, org),
          isNull(opportunities.deletedAt),
          eq(opportunities.stage, "won"),
        ),
      ),
    db
      .select({ c: count() })
      .from(quotations)
      .where(
        and(
          eq(quotations.orgId, org),
          isNull(quotations.deletedAt),
          inArray(quotations.status, ["draft", "in_review", "sent"]),
        ),
      ),
    db
      .select({ c: count() })
      .from(projects)
      .where(
        and(
          eq(projects.orgId, org),
          isNull(projects.deletedAt),
          inArray(projects.status, ["registered", "in_progress"]),
        ),
      ),
    db
      .select({ c: count() })
      .from(projects)
      .where(
        and(
          eq(projects.orgId, org),
          isNull(projects.deletedAt),
          eq(projects.status, "completed"),
        ),
      ),
    db
      .select({ c: count() })
      .from(contracts)
      .where(
        and(
          eq(contracts.orgId, org),
          isNull(contracts.deletedAt),
          eq(contracts.status, "active"),
        ),
      ),
    db
      .select({
        status: serviceTickets.status,
        slaDueAt: serviceTickets.slaDueAt,
      })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.orgId, org), isNull(serviceTickets.deletedAt))),
    db
      .select({ c: count() })
      .from(products)
      .where(
        and(
          eq(products.orgId, org),
          isNull(products.deletedAt),
          sql`${products.stockQty} <= ${products.reorderLevel} and ${products.reorderLevel} > 0`,
        ),
      ),
    db
      .select({ stage: opportunities.stage, c: count(), v: sum(opportunities.value) })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.orgId, org),
          isNull(opportunities.deletedAt),
          notInArray(opportunities.stage, ["won", "lost"]),
        ),
      )
      .groupBy(opportunities.stage),
    db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.orgId, org))
      .orderBy(desc(activityEvents.createdAt))
      .limit(8),
    db
      .select({ c: count() })
      .from(contracts)
      .where(
        and(
          eq(contracts.orgId, org),
          isNull(contracts.deletedAt),
          eq(contracts.status, "active"),
          sql`${contracts.renewalReminderAt} <= now() + interval '45 days'`,
        ),
      ),
  ]);

  const pipelineValue = openOpps.reduce((a, o) => a + n(o.value), 0);
  const weighted = openOpps.reduce(
    (a, o) => a + n(o.value) * (o.probability / 100),
    0,
  );
  const ticketsOpen = ticketRows.filter(
    (t) => t.status !== "resolved" && t.status !== "closed",
  );
  const now = Date.now();
  const ticketsBreached = ticketsOpen.filter(
    (t) => t.slaDueAt && new Date(t.slaDueAt).getTime() < now,
  ).length;

  const stageMap = new Map(
    stageRows.map((r) => [r.stage, { count: Number(r.c), value: n(r.v) }]),
  );
  const pipelineByStage = (
    ["new", "qualified", "budgetary", "technical", "commercial", "negotiation", "awaiting_po"] as OppStageKey[]
  ).map((stage) => ({
    stage,
    label: STAGE_META[stage].label,
    count: stageMap.get(stage)?.count ?? 0,
    value: stageMap.get(stage)?.value ?? 0,
  }));

  return {
    leadCount: Number(leadCount[0]?.c ?? 0),
    oppsOpen: openOpps.length,
    pipelineValue,
    weighted,
    wonCount: Number(wonAgg[0]?.c ?? 0),
    wonValue: n(wonAgg[0]?.v),
    quotesActive: Number(quotesActive[0]?.c ?? 0),
    projectsActive: Number(projActive[0]?.c ?? 0),
    projectsDone: Number(projDone[0]?.c ?? 0),
    contractsActive: Number(contractsActive[0]?.c ?? 0),
    ticketsOpen: ticketsOpen.length,
    ticketsBreached,
    lowStock: Number(lowStock[0]?.c ?? 0),
    renewalsSoon: Number(renewalsSoon[0]?.c ?? 0),
    pipelineByStage,
    recent,
  };
}

export async function reportsData(ctx: AuthContext) {
  requirePermission(ctx, "report.view");
  const org = ctx.orgId;

  const [
    oppOutcome,
    quoteStatus,
    projStatus,
    contractAgg,
    slaAgg,
    invAgg,
    wonByType,
  ] = await Promise.all([
    db
      .select({ stage: opportunities.stage, c: count(), v: sum(opportunities.value) })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.orgId, org),
          isNull(opportunities.deletedAt),
          inArray(opportunities.stage, ["won", "lost"]),
        ),
      )
      .groupBy(opportunities.stage),
    db
      .select({ status: quotations.status, c: count() })
      .from(quotations)
      .where(and(eq(quotations.orgId, org), isNull(quotations.deletedAt)))
      .groupBy(quotations.status),
    db
      .select({ status: projects.status, c: count() })
      .from(projects)
      .where(and(eq(projects.orgId, org), isNull(projects.deletedAt)))
      .groupBy(projects.status),
    db
      .select({
        revenue: sum(contracts.value),
        cost: sum(contracts.annualCost),
        c: count(),
      })
      .from(contracts)
      .where(and(eq(contracts.orgId, org), isNull(contracts.deletedAt))),
    db
      .select({
        met: sql<number>`count(*) filter (where ${serviceTickets.resolvedAt} is not null and ${serviceTickets.resolvedAt} <= ${serviceTickets.slaDueAt})`,
        breached: sql<number>`count(*) filter (where ${serviceTickets.resolvedAt} is not null and ${serviceTickets.resolvedAt} > ${serviceTickets.slaDueAt})`,
        resolved: sql<number>`count(*) filter (where ${serviceTickets.resolvedAt} is not null)`,
      })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.orgId, org), isNull(serviceTickets.deletedAt))),
    db
      .select({
        atCost: sql<string>`coalesce(sum(${products.stockQty} * ${products.cost}),0)`,
        atSell: sql<string>`coalesce(sum(${products.stockQty} * ${products.sellPrice}),0)`,
        skus: count(),
      })
      .from(products)
      .where(and(eq(products.orgId, org), isNull(products.deletedAt))),
    db
      .select({
        projectType: opportunities.projectType,
        c: count(),
        v: sum(opportunities.value),
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.orgId, org),
          isNull(opportunities.deletedAt),
          eq(opportunities.stage, "won"),
        ),
      )
      .groupBy(opportunities.projectType),
  ]);

  const won = Number(oppOutcome.find((o) => o.stage === "won")?.c ?? 0);
  const lost = Number(oppOutcome.find((o) => o.stage === "lost")?.c ?? 0);
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  const met = Number(slaAgg[0]?.met ?? 0);
  const breached = Number(slaAgg[0]?.breached ?? 0);
  const slaCompliance =
    met + breached > 0 ? Math.round((met / (met + breached)) * 100) : 100;

  return {
    winRate,
    won,
    lost,
    quoteStatus: quoteStatus.map((q) => ({ status: q.status, count: Number(q.c) })),
    projStatus: projStatus.map((p) => ({ status: p.status, count: Number(p.c) })),
    contract: {
      revenue: n(contractAgg[0]?.revenue),
      cost: n(contractAgg[0]?.cost),
      profit: n(contractAgg[0]?.revenue) - n(contractAgg[0]?.cost),
      count: Number(contractAgg[0]?.c ?? 0),
    },
    sla: { met, breached, resolved: Number(slaAgg[0]?.resolved ?? 0), compliance: slaCompliance },
    inventory: {
      atCost: n(invAgg[0]?.atCost),
      atSell: n(invAgg[0]?.atSell),
      skus: Number(invAgg[0]?.skus ?? 0),
    },
    wonByType: wonByType.map((w) => ({
      projectType: w.projectType,
      count: Number(w.c),
      value: n(w.v),
    })),
  };
}
