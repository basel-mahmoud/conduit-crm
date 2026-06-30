import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LeadForm } from "@/components/leads/lead-form";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "lead.create")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to create leads.
        </p>
      </div>
    );
  }
  const accounts = await listAccountOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Leads
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">New lead</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture an enquiry — project, customer, and estimated value.
      </p>
      <div className="mt-6">
        <LeadForm accounts={accounts} />
      </div>
    </div>
  );
}
