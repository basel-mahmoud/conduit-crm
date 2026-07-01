import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectTypeBadge } from "@/components/pipeline/badges";
import {
  HealthBadge,
  ProjectStatusBadge,
  SeverityBadge,
  SnagStatusBadge,
} from "@/components/projects/badges";
import { ProjectPhases } from "@/components/projects/project-phases";
import {
  AddMilestoneForm,
  AddSnagForm,
  SnagStatusControl,
} from "@/components/projects/forms";
import { formatAED, formatDate } from "@/lib/format";
import {
  deleteProjectAction,
  toggleMilestoneAction,
} from "@/modules/projects/actions";
import {
  getProjectFull,
  projectActivity,
} from "@/modules/projects/service";
import { createContractFromProjectAction } from "@/modules/contracts/actions";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "Project registered",
  phases_updated: "Phases updated",
};

export default async function ProjectControlRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getProjectFull(ctx, id);
  if (!data) notFound();

  const { project: p, phases, milestones, snags, pmName, progress } = data;
  const activity = await projectActivity(ctx, id);
  const canUpdate = can(ctx, "project.update");
  const canDelete = can(ctx, "project.delete");
  const canContract = can(ctx, "contract.create");
  const openSnags = snags.filter(
    (s) => s.status !== "resolved" && s.status !== "closed",
  ).length;

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 lg:px-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Projects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">{p.name}</h2>
            <ProjectTypeBadge type={p.projectType} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{p.code}</span>
            <span className="text-border">·</span>
            <ProjectStatusBadge status={p.status} />
            <span className="text-border">·</span>
            <HealthBadge health={p.health} />
            {pmName && (
              <>
                <span className="text-border">·</span>
                <span>PM: {pmName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.quotationId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/quotations/${p.quotationId}`}>
                <FileText className="size-3.5" /> Quotation
              </Link>
            </Button>
          )}
          {canContract && (
            <form action={createContractFromProjectAction}>
              <input type="hidden" name="projectId" value={p.id} />
              <Button type="submit" variant="outline" size="sm">
                <ShieldCheck className="size-3.5" /> Register AMC
              </Button>
            </form>
          )}
          {canUpdate && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${p.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={p.id} />
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

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Contract value" value={formatAED(p.contractValue)} />
        <Stat label="Progress" value={`${progress}%`} />
        <Stat
          label="Open snags"
          value={String(openSnags)}
          tone={openSnags > 0 ? "text-warning" : undefined}
        />
        <Stat
          label="Target end"
          value={p.targetEndDate ? formatDate(p.targetEndDate) : "—"}
        />
      </div>

      {/* Phases */}
      <div className="mt-6">
        <ProjectPhases
          projectId={p.id}
          editable={canUpdate}
          initial={phases.map((ph) => ({
            id: ph.id,
            kind: ph.kind,
            status: ph.status,
            progressPct: ph.progressPct,
          }))}
        />
      </div>

      {/* Milestones + snags */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Milestones</h3>
          <div className="mt-3 divide-y divide-border">
            {milestones.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                No milestones yet.
              </p>
            ) : (
              milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {canUpdate ? (
                      <form action={toggleMilestoneAction}>
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <input type="hidden" name="projectId" value={p.id} />
                        <button
                          type="submit"
                          className="grid cursor-pointer place-items-center"
                          aria-label="Toggle milestone"
                        >
                          {m.status === "done" ? (
                            <CheckCircle2 className="size-4 text-success" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      </form>
                    ) : m.status === "done" ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <span
                      className={`text-[13px] ${m.status === "done" ? "text-muted-foreground line-through" : ""}`}
                    >
                      {m.title}
                    </span>
                  </div>
                  {m.dueDate && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(m.dueDate)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          {canUpdate && (
            <div className="mt-4 border-t border-border pt-4">
              <AddMilestoneForm projectId={p.id} />
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Snag list</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {openSnags} open · {snags.length} total
            </span>
          </div>
          <div className="mt-3 divide-y divide-border">
            {snags.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                No snags logged.
              </p>
            ) : (
              snags.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={s.severity} />
                      <span className="truncate text-[13px]">{s.title}</span>
                    </div>
                    {s.dueDate && (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        due {formatDate(s.dueDate)}
                      </div>
                    )}
                  </div>
                  {canUpdate ? (
                    <SnagStatusControl
                      snagId={s.id}
                      projectId={p.id}
                      status={s.status}
                    />
                  ) : (
                    <SnagStatusBadge status={s.status} />
                  )}
                </div>
              ))
            )}
          </div>
          {canUpdate && (
            <div className="mt-4 border-t border-border pt-4">
              <AddSnagForm projectId={p.id} />
            </div>
          )}
        </section>
      </div>

      {/* Activity */}
      <section className="mt-6 rounded-lg border border-border bg-card p-5">
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
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${tone ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
