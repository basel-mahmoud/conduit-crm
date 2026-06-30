import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectTypeBadge } from "@/components/pipeline/badges";
import { QuotationStatusBadge } from "@/components/quotations/status-badge";
import { formatAED } from "@/lib/format";
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  type QuotationStatusKey,
} from "@/modules/quotations/labels";
import { listQuotations } from "@/modules/quotations/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotations" };

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = (QUOTATION_STATUSES as readonly string[]).includes(
    sp.status ?? "",
  )
    ? (sp.status as QuotationStatusKey)
    : undefined;
  const rows = await listQuotations(ctx, { q, status });
  const canViewCost = can(ctx, "quotation.cost.view");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Quotations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Technical quotations with BOQ, cost build-up and margin. Created from
          opportunities.
        </p>
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/quotations">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search quotations…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!status} href={q ? `/quotations?q=${encodeURIComponent(q)}` : "/quotations"}>
          All
        </Chip>
        {QUOTATION_STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={`/quotations?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {QUOTATION_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No quotations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open an opportunity and choose{" "}
              <span className="font-medium">Create quotation</span>.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/opportunities">Go to pipeline</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  {canViewCost && (
                    <th className="px-4 py-2.5 text-right font-medium">Margin</th>
                  )}
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {r.number}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotations/${r.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {r.accountName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ProjectTypeBadge type={r.projectType} />
                    </td>
                    {canViewCost && (
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                        {r.marginPct ? `${Number(r.marginPct)}%` : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-mono text-[12px] font-semibold tabular-nums">
                      {formatAED(r.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <QuotationStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} quotation{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
        active
          ? "border-primary bg-brand-weak text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
