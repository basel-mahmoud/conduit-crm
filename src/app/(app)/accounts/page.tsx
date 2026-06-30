import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AccountTypeBadge,
  RatingBadge,
  StatusDot,
} from "@/components/accounts/badges";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  type AccountTypeKey,
} from "@/modules/accounts/labels";
import { listAccounts } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts" };

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const type = (ACCOUNT_TYPES as readonly string[]).includes(sp.type ?? "")
    ? (sp.type as AccountTypeKey)
    : undefined;

  const rows = await listAccounts(ctx, { q, type });
  const canCreate = can(ctx, "account.create");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Customers, consultants, contractors, suppliers and brand partners.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/accounts/new">
              <Plus className="size-4" /> New account
            </Link>
          </Button>
        )}
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/accounts">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search accounts…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {type && <input type="hidden" name="type" value={type} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <TypeChip
          active={!type}
          href={q ? `/accounts?q=${encodeURIComponent(q)}` : "/accounts"}
        >
          All
        </TypeChip>
        {ACCOUNT_TYPES.map((t) => (
          <TypeChip
            key={t}
            active={type === t}
            href={`/accounts?type=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {ACCOUNT_TYPE_LABELS[t]}
          </TypeChip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No accounts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || type
                ? "No accounts match your filters."
                : "Create your first account to get started."}
            </p>
            {canCreate && !q && !type && (
              <Button asChild className="mt-4">
                <Link href="/accounts/new">
                  <Plus className="size-4" /> New account
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 text-center font-medium">Rating</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <AccountTypeBadge type={a.type} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {a.email || a.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {a.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RatingBadge rating={a.rating} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} account{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function TypeChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
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
