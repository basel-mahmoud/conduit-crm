import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileDown,
  FolderKanban,
  GitBranch,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectTypeBadge } from "@/components/pipeline/badges";
import { QuotationStatusBadge } from "@/components/quotations/status-badge";
import {
  QuotationBuilder,
  type BuilderLine,
} from "@/components/quotations/quotation-builder";
import { formatAED, formatDate } from "@/lib/format";
import {
  decideDiscountAction,
  deleteQuotationAction,
  newRevisionAction,
  setStatusAction,
} from "@/modules/quotations/actions";
import {
  getQuotationFull,
  quotationActivity,
} from "@/modules/quotations/service";
import { createProjectFromQuotationAction } from "@/modules/projects/actions";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "Quotation created",
  revision_saved: "Revision saved",
  revision_created: "New revision started",
  status_change: "Status changed",
  discount_approved: "Discount approved",
  discount_rejected: "Discount rejected",
};

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getQuotationFull(ctx, id);
  if (!data) notFound();

  const { quotation: q, current, lines, revisions, pendingApproval } = data;
  const activity = await quotationActivity(ctx, id);

  const canViewCost = can(ctx, "quotation.cost.view");
  const canUpdate = can(ctx, "quotation.update");
  const canSend = can(ctx, "quotation.send");
  const canApproveDiscount = can(ctx, "discount.approve");
  const canDelete = can(ctx, "quotation.delete");
  const canProject = can(ctx, "project.create");

  const editable =
    canViewCost &&
    canUpdate &&
    !!current &&
    current.status !== "superseded" &&
    (q.status === "draft" || q.status === "in_review");

  const builderLines: BuilderLine[] = lines.map((l) => ({
    sectionTitle: l.sectionTitle,
    description: l.description,
    qty: String(Number(l.qty)),
    unit: l.unit,
    materialUnitCost: String(Number(l.materialUnitCost)),
    laborUnitCost: String(Number(l.laborUnitCost)),
    engineeringUnitCost: String(Number(l.engineeringUnitCost)),
    subcontractorUnitCost: String(Number(l.subcontractorUnitCost)),
    markupPct: String(Number(l.markupPct)),
  }));

  const isOpen =
    q.status === "draft" || q.status === "in_review" || q.status === "approved";

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6">
      <Link
        href="/quotations"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Quotations
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">{q.title}</h2>
            <ProjectTypeBadge type={q.projectType} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{q.number}</span>
            <span className="text-border">·</span>
            <QuotationStatusBadge status={q.status} />
            {current && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-[12px]">Rev {current.revNo}</span>
              </>
            )}
            {q.accountName && (
              <>
                <span className="text-border">·</span>
                <span>{q.accountName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/quotations/${q.id}/pdf`} target="_blank" rel="noreferrer">
              <FileDown className="size-3.5" /> PDF
            </a>
          </Button>
          {canProject && (
            <form action={createProjectFromQuotationAction}>
              <input type="hidden" name="quotationId" value={q.id} />
              <Button type="submit" variant="outline" size="sm">
                <FolderKanban className="size-3.5" /> Register project
              </Button>
            </form>
          )}
          {canUpdate && (
            <form action={newRevisionAction}>
              <input type="hidden" name="quotationId" value={q.id} />
              <Button type="submit" variant="outline" size="sm">
                <GitBranch className="size-3.5" /> New revision
              </Button>
            </form>
          )}
          {canSend && isOpen && (
            <form action={setStatusAction}>
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="status" value="sent" />
              <Button type="submit" size="sm">
                <Send className="size-3.5" /> Send to customer
              </Button>
            </form>
          )}
          {canUpdate && q.status === "sent" && (
            <>
              <form action={setStatusAction}>
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="status" value="won" />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-success text-white hover:bg-success/90"
                >
                  <Check className="size-3.5" /> Won
                </Button>
              </form>
              <form action={setStatusAction}>
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="status" value="lost" />
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
          {canDelete && (
            <form action={deleteQuotationAction}>
              <input type="hidden" name="id" value={q.id} />
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

      {/* Discount approval banner */}
      {pendingApproval && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <p className="text-sm">
            <span className="font-medium text-warning">
              Discount {Number(pendingApproval.requestedPct)}% pending approval
            </span>
            {!canApproveDiscount && (
              <span className="ml-2 text-muted-foreground">
                — a manager must approve before this can be sent.
              </span>
            )}
          </p>
          {canApproveDiscount && (
            <div className="flex items-center gap-2">
              <form action={decideDiscountAction}>
                <input type="hidden" name="approvalId" value={pendingApproval.id} />
                <input type="hidden" name="quotationId" value={q.id} />
                <input type="hidden" name="decision" value="approved" />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-success text-white hover:bg-success/90"
                >
                  <Check className="size-3.5" /> Approve
                </Button>
              </form>
              <form action={decideDiscountAction}>
                <input type="hidden" name="approvalId" value={pendingApproval.id} />
                <input type="hidden" name="quotationId" value={q.id} />
                <input type="hidden" name="decision" value="rejected" />
                <Button type="submit" variant="outline" size="sm" className="text-danger">
                  <X className="size-3.5" /> Reject
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Builder */}
      {current ? (
        <div className="mt-6">
          {!editable && (
            <p className="mb-3 font-mono text-[11px] text-muted-foreground">
              {current.status === "superseded"
                ? "Superseded revision — read only."
                : !canViewCost
                  ? "Read-only — you can view prices but not the cost build-up."
                  : "Locked — start a new revision to edit."}
            </p>
          )}
          <QuotationBuilder
            revisionId={current.id}
            quotationId={q.id}
            vatRate={Number(current.vatRate)}
            initialLines={builderLines}
            initialDiscountPct={String(Number(current.discountPct))}
            initialValidUntil={current.validUntil ?? ""}
            initialNotes={current.notes ?? ""}
            canViewCost={canViewCost}
            editable={editable}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No revision found.</p>
      )}

      {/* Revisions + activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Revisions</h3>
          <div className="mt-3 divide-y divide-border">
            {revisions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px]">Rev {r.revNo}</span>
                  {current?.id === r.id && (
                    <span className="rounded bg-brand-weak px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
                      current
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {r.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] tabular-nums">
                    {formatAED(r.grandTotal)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

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
      </div>
    </div>
  );
}
