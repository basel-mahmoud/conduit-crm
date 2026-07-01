import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { formatDate } from "@/lib/format";
import {
  getCurrentUserDisplay,
  requireAuthContext,
  clerkEnabled,
} from "@/server/auth/context";
import { can } from "@/server/rbac/guard";
import { aiEnabled } from "@/server/ai/gateway";
import { OrgNameForm } from "./org-name-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-[13px]">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const ctx = await requireAuthContext();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);
  const me = await getCurrentUserDisplay();
  const canEdit =
    ctx.isAdmin || can(ctx, "setting.manage") || can(ctx, "org.manage");
  const vatPct = org ? (Number(org.vatRate) * 100).toFixed(2) : "—";

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization profile, your account, and system configuration.
        </p>
      </div>

      {/* Organization */}
      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Organization</h3>
        </header>
        <div className="px-5 py-4">
          <OrgNameForm defaultName={org?.name ?? ""} canEdit={canEdit} />
        </div>
        <div className="divide-y divide-border border-t border-border">
          <Row label="Slug" value={<span className="font-mono">{org?.slug ?? "—"}</span>} />
          <Row label="Currency" value={org?.currency ?? "AED"} />
          <Row label="VAT rate" value={`${vatPct}%`} />
          <Row label="Fiscal year start" value={org?.fiscalYearStart ?? "—"} />
          <Row label="Created" value={formatDate(org?.createdAt)} />
        </div>
      </section>

      {/* Your account */}
      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Your account</h3>
        </header>
        <div className="divide-y divide-border">
          <Row label="Name" value={me?.name ?? "—"} />
          <Row label="Email" value={<span className="font-mono text-[12px]">{me?.email || "—"}</span>} />
          <Row label="Role" value={me?.roleName ?? "—"} />
          <Row label="Organization" value={me?.orgName ?? "—"} />
        </div>
        <p className="border-t border-border px-5 py-3 text-[12px] text-muted-foreground">
          Manage your profile, password and sessions from the account menu in the
          top-right.
        </p>
      </section>

      {/* System */}
      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">System</h3>
        </header>
        <div className="divide-y divide-border">
          <Row
            label="Authentication"
            value={
              <span className={clerkEnabled ? "text-success" : "text-warning"}>
                {clerkEnabled ? "Clerk (live)" : "Dev-auth"}
              </span>
            }
          />
          <Row
            label="AI assistant"
            value={
              <span className={aiEnabled ? "text-success" : "text-muted-foreground"}>
                {aiEnabled ? "Google Gemini" : "Heuristic (no key)"}
              </span>
            }
          />
          <Row label="Tenancy" value="Single-tenant" />
          <Row
            label="Organization ID"
            value={<span className="font-mono text-[11px] text-muted-foreground">{ctx.orgId}</span>}
          />
        </div>
      </section>
    </div>
  );
}
