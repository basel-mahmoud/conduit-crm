import { KeyRound, ShieldCheck } from "lucide-react";

import { navGroups } from "@/lib/nav";
import { TEST_ACCOUNTS, TEST_PASSWORD } from "@/lib/test-accounts";
import {
  getCurrentUserDisplay,
  requireAuthContext,
} from "@/server/auth/context";
import { can } from "@/server/rbac/guard";
import type { PermissionKey } from "@/server/rbac/permissions";
import { SYSTEM_ROLES, SYSTEM_ROLE_BY_KEY } from "@/server/rbac/roles";
import type { RoleKey } from "@/server/rbac/roles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guide" };

export default async function GuidePage() {
  const ctx = await requireAuthContext();
  const me = await getCurrentUserDisplay();

  const myRoles = ctx.roleKeys
    .map((k) => SYSTEM_ROLE_BY_KEY[k as RoleKey]?.name ?? k)
    .join(", ");
  const canViewCosts = can(ctx, "quotation.cost.view");

  const modules = navGroups
    .flatMap((g) => g.items)
    .filter((i) => i.href !== "/guide" && i.href !== "/dashboard")
    .map((i) => ({
      label: i.label,
      allowed: !i.permission || can(ctx, i.permission as PermissionKey),
    }));

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Access guide
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What you can do in Conduit, how access levels work, and ready demo
          accounts for every level.
        </p>
      </div>

      {/* Your access */}
      <section className="rounded-lg border border-primary/25 bg-brand-weak/30 p-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Your access
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{me?.name}</span>{" "}
          (<span className="font-mono text-[12.5px]">{me?.email}</span>) with
          role{ctx.roleKeys.length === 1 ? "" : "s"}{" "}
          <span className="font-medium text-primary">{myRoles || "none"}</span>.
          {" "}Financial cost &amp; margin fields are{" "}
          <span className="text-foreground">
            {canViewCosts ? "visible" : "hidden"}
          </span>{" "}
          for you.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {modules.map((m) => (
            <span
              key={m.label}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                m.allowed
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground line-through opacity-60"
              }`}
            >
              {m.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          Green = modules your role can open. Struck-through modules are hidden
          from your sidebar. Your access level always shows in the top bar and
          the sidebar footer.
        </p>
      </section>

      {/* How access works */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">How access works</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Every account holds one or more <span className="text-foreground">roles</span>;
            each role grants specific permissions at a{" "}
            <span className="text-foreground">scope</span> (own records → team →
            whole organization).
          </li>
          <li>
            New sign-ups start with <span className="text-foreground">no access</span> and
            see a pending screen until an Administrator assigns a role in{" "}
            <span className="text-foreground">Admin → Users &amp; Roles → Edit access</span>.
          </li>
          <li>
            Cost, markup and margin figures are field-level gated — only roles
            with cost visibility (Admin, MD, GM, Sales Manager, Estimator,
            Procurement, Accountant) ever see them.
          </li>
          <li>
            Every create, update, delete, and role change is written to the
            tamper-evident audit trail.
          </li>
        </ul>
      </section>

      {/* Roles reference */}
      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Access levels</h3>
        </header>
        <div className="divide-y divide-border">
          {SYSTEM_ROLES.map((r) => (
            <div key={r.key} className="flex items-start gap-4 px-5 py-3">
              <div className="w-44 shrink-0">
                <div className="text-[13px] font-medium">{r.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {r.key}
                </div>
              </div>
              <p className="min-w-0 flex-1 text-[12.5px] text-muted-foreground">
                {r.description}
              </p>
              {ctx.roleKeys.includes(r.key) && (
                <span className="shrink-0 rounded bg-brand-weak px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                  you
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Test accounts */}
      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <KeyRound className="size-4 text-primary" /> Demo accounts — one per level
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            test product only
          </span>
        </header>
        <div className="px-5 py-3 text-sm text-muted-foreground">
          Sign out, then sign in with one of these emails and the shared demo
          password{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
            {TEST_PASSWORD}
          </span>{" "}
          — these are Clerk development test accounts; no real mailbox exists.
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-medium">Access level</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              {TEST_ACCOUNTS.map((a) => (
                <tr key={a.email} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-medium">{a.roleName}</td>
                  <td className="px-5 py-2.5 font-mono text-[12px] text-muted-foreground">
                    {a.email}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-[12px]">{TEST_PASSWORD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modules */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Module map</h3>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2">
          <div><dt className="font-medium">Leads</dt><dd className="text-muted-foreground">Capture enquiries; qualify and convert to opportunities.</dd></div>
          <div><dt className="font-medium">Opportunities</dt><dd className="text-muted-foreground">9-stage pipeline with kanban, forecast and AI assist.</dd></div>
          <div><dt className="font-medium">Quotations</dt><dd className="text-muted-foreground">BOQ builder, cost build-up, approvals, customer PDF.</dd></div>
          <div><dt className="font-medium">Accounts</dt><dd className="text-muted-foreground">Customers, consultants, contractors, suppliers + contacts.</dd></div>
          <div><dt className="font-medium">Projects</dt><dd className="text-muted-foreground">Execution control room — phases, milestones, snags.</dd></div>
          <div><dt className="font-medium">AMC &amp; PPM</dt><dd className="text-muted-foreground">Maintenance contracts, assets, scheduled visits.</dd></div>
          <div><dt className="font-medium">Service</dt><dd className="text-muted-foreground">Tickets with priority SLAs, dispatch and CSAT.</dd></div>
          <div><dt className="font-medium">Inventory / Equipment</dt><dd className="text-muted-foreground">Catalog, stock ledger, purchase orders, tech library.</dd></div>
          <div><dt className="font-medium">Reports</dt><dd className="text-muted-foreground">Live KPIs — win rate, SLA compliance, valuation.</dd></div>
          <div><dt className="font-medium">Documents</dt><dd className="text-muted-foreground">Register of generated customer documents (PDFs).</dd></div>
        </dl>
      </section>
    </div>
  );
}
