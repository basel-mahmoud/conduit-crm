import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LeadStatusBadge,
  ProjectTypeBadge,
} from "@/components/pipeline/badges";
import { AiAssistPanel } from "@/components/ai/assist-panel";
import { formatAED, formatDate } from "@/lib/format";
import {
  convertLeadAction,
  deleteLeadAction,
} from "@/modules/leads/actions";
import { LEAD_SOURCE_LABELS } from "@/modules/leads/labels";
import { getLead, leadActivity } from "@/modules/leads/service";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "Lead captured",
  updated: "Lead updated",
  converted: "Converted to opportunity",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const lead = await getLead(ctx, id);
  if (!lead) notFound();

  const [activity, accounts] = await Promise.all([
    leadActivity(ctx, id),
    listAccountOptions(ctx),
  ]);
  const nameOf = (aid: string | null) =>
    aid ? (accounts.find((a) => a.id === aid)?.name ?? "—") : "—";

  const canEdit = can(ctx, "lead.update");
  const canConvert = can(ctx, "lead.convert");
  const canDelete = can(ctx, "lead.delete");
  const isConverted = !!lead.convertedOpportunityId;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Leads
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {lead.projectName}
            </h2>
            <ProjectTypeBadge type={lead.projectType} />
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{lead.refNo}</span>
            <span className="text-border">·</span>
            <LeadStatusBadge status={lead.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canConvert && !isConverted && (
            <form action={convertLeadAction}>
              <input type="hidden" name="id" value={lead.id} />
              <Button type="submit" size="sm">
                <ArrowRightLeft className="size-3.5" /> Convert to opportunity
              </Button>
            </form>
          )}
          {canEdit && !isConverted && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/leads/${lead.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <form action={deleteLeadAction}>
              <input type="hidden" name="id" value={lead.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      {isConverted && (
        <Link
          href={`/opportunities/${lead.convertedOpportunityId}`}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-brand-weak px-3 py-2 text-[13px] text-primary"
        >
          <ArrowRightLeft className="size-3.5" /> This lead was converted — view
          the opportunity →
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Enquiry details</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail k="Source" v={LEAD_SOURCE_LABELS[lead.source]} />
            <Detail k="Est. value" v={formatAED(lead.estValue)} mono />
            <Detail k="Customer" v={nameOf(lead.accountId)} />
            <Detail k="Consultant" v={nameOf(lead.consultantId)} />
            <Detail k="Contractor" v={nameOf(lead.contractorId)} />
            <Detail k="Location" v={lead.projectLocation} />
            <Detail
              k="Next follow-up"
              v={lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : null}
              mono
            />
          </dl>
          {lead.notes && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {lead.notes}
            </p>
          )}
        </section>

        <aside className="space-y-6">
          <AiAssistPanel kind="lead" id={lead.id} />
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Activity</h3>
            <ol className="mt-3 space-y-3">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <div className="text-[13px]">
                        {ACTIVITY_LABELS[e.type] ?? e.type}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  k,
  v,
  mono,
}: {
  k: string;
  v?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className={mono ? "mt-0.5 font-mono text-[12.5px]" : "mt-0.5 text-sm"}>
        {v || "—"}
      </dd>
    </div>
  );
}
