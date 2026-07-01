import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContractStatusBadge,
  ContractTypeBadge,
} from "@/components/contracts/badges";
import { formatAED, formatDate } from "@/lib/format";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  type ContractStatusKey,
} from "@/modules/contracts/labels";
import { listContracts } from "@/modules/contracts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "AMC & PPM" };

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = (CONTRACT_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as ContractStatusKey)
    : undefined;
  const rows = await listContracts(ctx, { q, status });
  const canCreate = can(ctx, "contract.create");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">AMC &amp; PPM</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintenance contracts, asset registry and planned visits.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/contracts/new">
              <Plus className="size-4" /> New contract
            </Link>
          </Button>
        )}
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/contracts">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search contracts…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!status} href={q ? `/contracts?q=${encodeURIComponent(q)}` : "/contracts"}>
          All
        </Chip>
        {CONTRACT_STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={`/contracts?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {CONTRACT_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No contracts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Register an AMC from a delivered project, or create one directly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 text-right font-medium">Value</th>
                  <th className="px-4 py-2.5 font-medium">Ends</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {c.number}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ContractTypeBadge type={c.type} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {c.accountName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(c.value)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {c.endDate ? formatDate(c.endDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ContractStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} contract{rows.length === 1 ? "" : "s"}
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
