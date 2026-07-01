import { formatAED } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatusKey,
} from "@/modules/projects/labels";
import {
  QUOTATION_STATUS_LABELS,
  type QuotationStatusKey,
} from "@/modules/quotations/labels";
import {
  PROJECT_TYPE_LABELS,
  type ProjectTypeKey,
} from "@/modules/shared/project-types";
import { reportsData } from "@/modules/reports/queries";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "report.view")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to view reports.
        </p>
      </div>
    );
  }
  const d = await reportsData(ctx);
  const contractMargin =
    d.contract.revenue > 0
      ? Math.round((d.contract.profit / d.contract.revenue) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live performance across sales, delivery, service and inventory.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {/* Sales performance */}
        <Card title="Sales performance">
          <Big value={`${d.winRate}%`} label="quotation win rate" />
          <div className="mt-3 flex gap-4 font-mono text-[12px]">
            <span className="text-success">{d.won} won</span>
            <span className="text-danger">{d.lost} lost</span>
          </div>
        </Card>

        {/* AMC profitability */}
        <Card title="AMC / PPM profitability">
          <Big
            value={formatAED(d.contract.profit, { compact: true })}
            label={`${contractMargin}% margin · ${d.contract.count} contracts`}
          />
          <div className="mt-3 flex gap-4 font-mono text-[12px] text-muted-foreground">
            <span>Rev {formatAED(d.contract.revenue, { compact: true })}</span>
            <span>Cost {formatAED(d.contract.cost, { compact: true })}</span>
          </div>
        </Card>

        {/* Service SLA */}
        <Card title="Service SLA performance">
          <Big
            value={`${d.sla.compliance}%`}
            label={`SLA compliance · ${d.sla.resolved} resolved`}
            tone={d.sla.compliance >= 90 ? "success" : d.sla.compliance >= 70 ? "warning" : "danger"}
          />
          <div className="mt-3 flex gap-4 font-mono text-[12px]">
            <span className="text-success">{d.sla.met} met</span>
            <span className="text-danger">{d.sla.breached} breached</span>
          </div>
        </Card>

        {/* Inventory value */}
        <Card title="Inventory valuation">
          <Big
            value={formatAED(d.inventory.atCost, { compact: true })}
            label={`at cost · ${d.inventory.skus} SKUs`}
          />
          <div className="mt-3 font-mono text-[12px] text-muted-foreground">
            {formatAED(d.inventory.atSell, { compact: true })} at sell price
          </div>
        </Card>

        {/* Quotation status */}
        <Card title="Quotations by status">
          <Bars
            rows={d.quoteStatus.map((q) => ({
              label: QUOTATION_STATUS_LABELS[q.status as QuotationStatusKey],
              count: q.count,
            }))}
          />
        </Card>

        {/* Project status */}
        <Card title="Projects by status">
          <Bars
            rows={d.projStatus.map((p) => ({
              label: PROJECT_STATUS_LABELS[p.status as ProjectStatusKey],
              count: p.count,
            }))}
          />
        </Card>

        {/* Won by system type */}
        <Card title="Won by system type" wide>
          {d.wonByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No won deals yet.</p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const max = Math.max(1, ...d.wonByType.map((w) => w.value));
                return d.wonByType
                  .sort((a, b) => b.value - a.value)
                  .map((w) => (
                    <div key={w.projectType} className="flex items-center gap-3">
                      <div className="w-32 shrink-0 text-[12px] text-muted-foreground">
                        {PROJECT_TYPE_LABELS[w.projectType as ProjectTypeKey]}
                      </div>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full rounded bg-primary"
                          style={{ width: `${Math.max(4, (w.value / max) * 100)}%` }}
                        />
                      </div>
                      <div className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatAED(w.value, { compact: true })}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-5 ${wide ? "md:col-span-2 xl:col-span-3" : ""}`}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Big({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-danger"
          : "";
  return (
    <div>
      <div className={`font-mono text-3xl font-semibold tabular-nums tracking-tight ${toneCls}`}>
        {value}
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No data.</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-[12px] text-muted-foreground">
            {r.label}
          </div>
          <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-[color-mix(in_oklab,var(--brand)_70%,transparent)]"
              style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }}
            />
          </div>
          <div className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums">
            {r.count}
          </div>
        </div>
      ))}
    </div>
  );
}
