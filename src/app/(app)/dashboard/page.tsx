import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type Kpi = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  sub?: string;
};

const kpis: Kpi[] = [
  { label: "Total Leads", value: "128", delta: "+12", trend: "up", sub: "this quarter" },
  { label: "Open Opportunities", value: "43", delta: "+5", trend: "up", sub: "AED 9.4M weighted" },
  { label: "Active Quotations", value: "27", delta: "−3", trend: "down", sub: "6 awaiting approval" },
  { label: "Won — YTD", value: "AED 18.6M", delta: "+22%", trend: "up", sub: "win rate 31%" },
  { label: "AMC / PPM", value: "61", delta: "+4", trend: "up", sub: "9 renew ≤ 30d" },
  { label: "Open Tickets", value: "14", delta: "2 SLA risk", trend: "down", sub: "avg 4.2h response" },
];

const pipeline = [
  { stage: "New Lead", count: 31, value: "2.1M" },
  { stage: "Qualified", count: 22, value: "3.4M" },
  { stage: "Budgetary Offer", count: 16, value: "5.8M" },
  { stage: "Technical", count: 12, value: "6.2M" },
  { stage: "Commercial", count: 9, value: "7.1M" },
  { stage: "Negotiation", count: 6, value: "4.9M" },
  { stage: "Awaiting PO", count: 4, value: "3.3M" },
];
const maxCount = Math.max(...pipeline.map((p) => p.count));

const attention = [
  { icon: ShieldAlert, text: "AMC-0312 · Emaar FM expires in 11 days", meta: "renewal" },
  { icon: Clock, text: "TKT-2026-0091 breaches SLA in 1h 40m", meta: "p2 · service" },
  { icon: Clock, text: "Follow-up overdue · Damac Hills BMS", meta: "opportunity" },
  { icon: ShieldAlert, text: "QT-2026-0142 discount needs GM approval", meta: "18% margin" },
];

const activity = [
  { t: "09:42", text: "Quotation QT-2026-0142 sent to Emaar FM", tag: "Quote" },
  { t: "09:18", text: "Opportunity moved to Negotiation · Aldar HQ LCS", tag: "Pipeline" },
  { t: "08:55", text: "PPM visit completed · Marina Gate chiller plant", tag: "Service" },
  { t: "08:31", text: "New lead captured · Sobha BTU metering", tag: "Lead" },
  { t: "Yst", text: "Project PRJ-0098 reached Testing & Commissioning", tag: "Project" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Command Center</h2>
            <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              illustrative data
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Lead-to-cash overview across sales, delivery, and service.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md p-0.5 ring-hairline">
          {["Week", "Month", "Quarter", "Year"].map((p, i) => (
            <button
              key={p}
              className={cn(
                "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                i === 2
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight">
              {k.value}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
                  k.trend === "up"
                    ? "bg-[color-mix(in_oklab,var(--success)_16%,transparent)] text-success"
                    : "bg-[color-mix(in_oklab,var(--danger)_16%,transparent)] text-danger",
                )}
              >
                {k.trend === "up" ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {k.delta}
              </span>
              {k.sub && (
                <span className="truncate text-[11px] text-muted-foreground">
                  {k.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lower grid */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Pipeline */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pipeline by stage</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              AED 32.8M open
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {pipeline.map((p) => (
              <div key={p.stage} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-[12px] text-muted-foreground">
                  {p.stage}
                </div>
                <div className="h-6 flex-1 overflow-hidden rounded-[5px] bg-muted">
                  <div
                    className="flex h-full items-center justify-end rounded-[5px] bg-gradient-to-r from-[color-mix(in_oklab,var(--brand)_55%,transparent)] to-primary pr-2"
                    style={{ width: `${(p.count / maxCount) * 100}%` }}
                  >
                    <span className="font-mono text-[10px] font-medium text-primary-foreground">
                      {p.count}
                    </span>
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {p.value}
                </div>
              </div>
            ))}
          </div>

          {/* Target vs actual */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between text-sm">
              <h3 className="font-semibold">Sales target — FY2026</h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                62% of AED 30.0M
              </span>
            </div>
            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "62%" }}
              />
              <div className="absolute inset-y-0 left-[75%] w-px bg-foreground/40" />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>AED 18.6M actual</span>
              <span>pace 75%</span>
              <span>AED 30.0M target</span>
            </div>
          </div>
        </div>

        {/* Attention + activity */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Needs attention</h3>
            <ul className="mt-3 space-y-2.5">
              {attention.map((a) => {
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
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <ul className="mt-3 space-y-3">
              {activity.map((a) => (
                <li key={a.text} className="flex gap-3">
                  <span className="w-9 shrink-0 pt-px font-mono text-[10px] text-muted-foreground">
                    {a.t}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[12.5px] leading-snug">{a.text}</span>
                    <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {a.tag}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
