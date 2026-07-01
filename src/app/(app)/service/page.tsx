import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PriorityBadge,
  SlaBadge,
  TicketStatusBadge,
} from "@/components/service/badges";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  slaState,
  type TicketStatusKey,
} from "@/modules/service/labels";
import { listTickets } from "@/modules/service/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service" };

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = (TICKET_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as TicketStatusKey)
    : undefined;
  const rows = await listTickets(ctx, { q, status });
  const canCreate = can(ctx, "ticket.create");

  const openBreached = rows.filter((t) => slaState(t) === "breached").length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Service</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Breakdown & PPM tickets with SLA monitoring and dispatch.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/service/new">
              <Plus className="size-4" /> New ticket
            </Link>
          </Button>
        )}
      </div>

      {openBreached > 0 && (
        <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {openBreached} open ticket{openBreached === 1 ? "" : "s"} past SLA.
        </div>
      )}

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/service">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search tickets…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!status} href={q ? `/service?q=${encodeURIComponent(q)}` : "/service"}>
          All
        </Chip>
        {TICKET_STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={`/service?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {TICKET_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No tickets</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Log a breakdown or service request to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Ref</th>
                  <th className="px-4 py-2.5 font-medium">Summary</th>
                  <th className="px-4 py-2.5 font-medium">Priority</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">SLA</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {t.number}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/service/${t.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {t.accountName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SlaBadge ticket={t} />
                    </td>
                    <td className="px-4 py-3">
                      <TicketStatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} ticket{rows.length === 1 ? "" : "s"}
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
