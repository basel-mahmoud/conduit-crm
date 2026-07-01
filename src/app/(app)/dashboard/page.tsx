import Link from "next/link";
import { Clock, PackageX, ShieldAlert } from "lucide-react";

import { formatAED } from "@/lib/format";
import { dashboardSummary } from "@/modules/reports/queries";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const ACTIVITY_VERB: Record<string, string> = {
  created: "created",
  updated: "updated",
  converted: "converted",
  created_from_lead: "created from lead",
  quotation_created: "quotation created",
  revision_saved: "quotation revised",
  status_change: "status changed",
  stage_change: "stage moved",
  phases_updated: "phases updated",
  project_registered: "project registered",
  contact_added: "contact added",
  discount_approved: "discount approved",
  discount_rejected: "discount rejected",
};

export default async function DashboardPage() {
  const ctx = await requireAuthContext();
  const s = await dashboardSummary(ctx);

  const kpis = [
    { label: "Total Leads", value: String(s.leadCount), sub: "in the funnel" },
    {
      label: "Open Opportunities",
      value: String(s.oppsOpen),
      sub: `${formatAED(s.weighted, { compact: true })} weighted`,
    },
    {
      label: "Active Quotations",
      value: String(s.quotesActive),
      sub: "draft / in review / sent",
    },
    {
      label: "Won — pipeline",
      value: formatAED(s.wonValue, { compact: true }),
      sub: `${s.wonCount} opportunities won`,
    },
    {
      label: "AMC / PPM",
      value: String(s.contractsActive),
      sub: s.renewalsSoon > 0 ? `${s.renewalsSoon} renew ≤ 45d` : "active",
    },
    {
      label: "Open Tickets",
      value: String(s.ticketsOpen),
      sub:
        s.ticketsBreached > 0
          ? `${s.ticketsBreached} past SLA`
          : "within SLA",
      tone: s.ticketsBreached > 0 ? "danger" : undefined,
    },
  ];

  const maxCount = Math.max(1, ...s.pipelineByStage.map((p) => p.count));
  const target = 30_000_000;
  const pace = Math.min(100, Math.round((s.wonValue / target) * 100));

  const attention: { icon: typeof Clock; text: string; meta: string }[] = [];
  if (s.ticketsBreached > 0)
    attention.push({
      icon: Clock,
      text: `${s.ticketsBreached} service ticket${s.ticketsBreached === 1 ? "" : "s"} past SLA`,
      meta: "service",
    });
  if (s.renewalsSoon > 0)
    attention.push({
      icon: ShieldAlert,
      text: `${s.renewalsSoon} contract${s.renewalsSoon === 1 ? "" : "s"} renewing within 45 days`,
      meta: "amc / ppm",
    });
  if (s.lowStock > 0)
    attention.push({
      icon: PackageX,
      text: `${s.lowStock} product${s.lowStock === 1 ? "" : "s"} at or below reorder level`,
      meta: "inventory",
    });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Command Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lead-to-cash overview across sales, delivery, and service — live data.
          </p>
        </div>
        <Link
          href="/reports"
          className="rounded-md border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          View reports →
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {k.label}
            </div>
            <div
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight ${k.tone === "danger" ? "text-danger" : ""}`}
            >
              {k.value}
            </div>
            <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Pipeline */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pipeline by stage</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatAED(s.pipelineValue, { compact: true })} open
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {s.pipelineByStage.map((p) => (
              <div key={p.stage} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-[12px] text-muted-foreground">
                  {p.label}
                </div>
                <div className="h-6 flex-1 overflow-hidden rounded-[5px] bg-muted">
                  <div
                    className="flex h-full items-center justify-end rounded-[5px] bg-gradient-to-r from-[color-mix(in_oklab,var(--brand)_55%,transparent)] to-primary pr-2"
                    style={{ width: `${Math.max(6, (p.count / maxCount) * 100)}%` }}
                  >
                    <span className="font-mono text-[10px] font-medium text-primary-foreground">
                      {p.count}
                    </span>
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {formatAED(p.value, { compact: true })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between text-sm">
              <h3 className="font-semibold">Won vs target</h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                {pace}% of {formatAED(target, { compact: true })}
              </span>
            </div>
            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pace}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{formatAED(s.wonValue, { compact: true })} won</span>
              <span>{formatAED(target, { compact: true })} target</span>
            </div>
          </div>
        </div>

        {/* Attention + activity */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Needs attention</h3>
            <ul className="mt-3 space-y-2.5">
              {attention.length === 0 ? (
                <li className="text-[12.5px] text-muted-foreground">
                  All clear — nothing needs attention.
                </li>
              ) : (
                attention.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.text} className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] leading-snug">{a.text}</div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {a.meta}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <ul className="mt-3 space-y-3">
              {s.recent.length === 0 ? (
                <li className="text-[12.5px] text-muted-foreground">
                  No activity yet.
                </li>
              ) : (
                s.recent.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="w-12 shrink-0 pt-px font-mono text-[10px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[12.5px] capitalize leading-snug">
                        {e.subjectType} {ACTIVITY_VERB[e.type] ?? e.type}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
