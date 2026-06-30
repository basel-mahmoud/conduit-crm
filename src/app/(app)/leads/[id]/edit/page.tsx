import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LeadForm } from "@/components/leads/lead-form";
import { getLead } from "@/modules/leads/service";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit lead" };

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const lead = await getLead(ctx, id);
  if (!lead) notFound();
  if (!can(ctx, "lead.update")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
      </div>
    );
  }
  const accounts = await listAccountOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href={`/leads/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {lead.projectName}
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">Edit lead</h2>
      <div className="mt-6">
        <LeadForm lead={lead} accounts={accounts} />
      </div>
    </div>
  );
}
