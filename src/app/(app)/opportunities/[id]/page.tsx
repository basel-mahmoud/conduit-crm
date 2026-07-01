import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ProjectTypeBadge,
  StageBadge,
} from "@/components/pipeline/badges";
import { AiAssistPanel } from "@/components/ai/assist-panel";
import { formatAED, formatDate } from "@/lib/format";
import {
  deleteOpportunityAction,
  setStageAction,
} from "@/modules/opportunities/actions";
import { createQuotationFromOpportunityAction } from "@/modules/quotations/actions";
import {
  APPROVAL_LABELS,
  APPROVAL_TONE,
  STAGE_META,
  type ApprovalKey,
  type OppStageKey,
} from "@/modules/opportunities/labels";
import {
  getOpportunity,
  opportunityActivity,
} from "@/modules/opportunities/service";
import { cn } from "@/lib/utils";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const opp = await getOpportunity(ctx, id);
  if (!opp) notFound();

  const activity = await opportunityActivity(ctx, id);
  const canEdit = can(ctx, "opportunity.update");
  const canDelete = can(ctx, "opportunity.delete");
  const canQuote = can(ctx, "quotation.create");
  const isClosed = opp.stage === "won" || opp.stage === "lost";

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Pipeline
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {opp.name}
            </h2>
            <ProjectTypeBadge type={opp.projectType} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{opp.refNo}</span>
            <span className="text-border">·</span>
            <StageBadge stage={opp.stage} />
            <span className="text-border">·</span>
            <span className="font-mono text-[12px]">{opp.probability}%</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && !isClosed && (
            <>
              <form action={setStageAction}>
                <input type="hidden" name="id" value={opp.id} />
                <input type="hidden" name="stage" value="won" />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-success text-white hover:bg-success/90"
                >
                  <Check className="size-3.5" /> Won
                </Button>
              </form>
              <form action={setStageAction}>
                <input type="hidden" name="id" value={opp.id} />
                <input type="hidden" name="stage" value="lost" />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-danger"
                >
                  <X className="size-3.5" /> Lost
                </Button>
              </form>
            </>
          )}
          {canQuote && (
            <form action={createQuotationFromOpportunityAction}>
              <input type="hidden" name="opportunityId" value={opp.id} />
              <Button type="submit" variant="outline" size="sm">
                <FileText className="size-3.5" /> Create quotation
              </Button>
            </form>
          )}
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/opportunities/${opp.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <form action={deleteOpportunityAction}>
              <input type="hidden" name="id" value={opp.id} />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Opportunity details</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail k="Customer" v={opp.accountName} />
            <Detail k="Value" v={formatAED(opp.value)} mono />
            <Detail
              k="Expected close"
              v={opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : null}
              mono
            />
            <Detail k="Competitor" v={opp.competitor} />
            <ApprovalDetail k="Consultant approval" v={opp.consultantApproval} />
            <ApprovalDetail k="Contractor approval" v={opp.contractorApproval} />
          </dl>
          {opp.lostReason && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-danger">
              Lost: {opp.lostReason}
            </p>
          )}
          {opp.notes && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {opp.notes}
            </p>
          )}
        </section>

        <aside className="space-y-6">
          <AiAssistPanel kind="opportunity" id={opp.id} />
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
                      <div className="text-[13px]">{activityLabel(e)}</div>
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

function activityLabel(e: {
  type: string;
  payload: unknown;
}): string {
  if (e.type === "stage_change") {
    const p = e.payload as { from?: OppStageKey; to?: OppStageKey } | null;
    if (p?.from && p?.to) {
      return `Moved ${STAGE_META[p.from].label} → ${STAGE_META[p.to].label}`;
    }
    return "Stage changed";
  }
  return (
    {
      created: "Opportunity created",
      updated: "Opportunity updated",
      created_from_lead: "Created from lead",
    } as Record<string, string>
  )[e.type] ?? e.type;
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

function ApprovalDetail({ k, v }: { k: string; v: ApprovalKey }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className={cn("mt-0.5 text-sm font-medium", APPROVAL_TONE[v])}>
        {APPROVAL_LABELS[v]}
      </dd>
    </div>
  );
}
