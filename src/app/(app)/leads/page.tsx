import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LeadStatusBadge,
  ProjectTypeBadge,
} from "@/components/pipeline/badges";
import { formatAED } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatusKey,
} from "@/modules/leads/labels";
import { listLeads } from "@/modules/leads/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = (LEAD_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as LeadStatusKey)
    : undefined;
  const rows = await listLeads(ctx, { q, status });
  const canCreate = can(ctx, "lead.create");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Incoming enquiries — capture, qualify, and convert to opportunities.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="size-4" /> New lead
            </Link>
          </Button>
        )}
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/leads">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search leads…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!status} href={q ? `/leads?q=${encodeURIComponent(q)}` : "/leads"}>
          All
        </Chip>
        {LEAD_STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={`/leads?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {LEAD_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || status
                ? "No leads match your filters."
                : "Capture your first enquiry to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Ref</th>
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 text-right font-medium">Est. value</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {l.refNo}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${l.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {l.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ProjectTypeBadge type={l.projectType} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {l.accountName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(l.estValue)}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} lead{rows.length === 1 ? "" : "s"}
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
