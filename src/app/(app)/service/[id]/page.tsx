import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Play, RotateCcw, Trash2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PriorityBadge,
  SlaBadge,
  TicketStatusBadge,
} from "@/components/service/badges";
import { ResolveForm } from "@/components/service/resolve-form";
import {
  assignTicketAction,
  deleteTicketAction,
  setTicketStatusAction,
} from "@/modules/service/actions";
import { TICKET_TYPE_LABELS } from "@/modules/service/labels";
import { getTicketFull, ticketActivity } from "@/modules/service/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const fmt = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("en-GB") : "—";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const t = await getTicketFull(ctx, id);
  if (!t) notFound();

  const activity = await ticketActivity(ctx, id);
  const canUpdate = can(ctx, "ticket.update");
  const canAssign = can(ctx, "ticket.assign");
  const closed = t.status === "resolved" || t.status === "closed";

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/service"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Service
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">{t.title}</h2>
            <PriorityBadge priority={t.priority} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{t.number}</span>
            <span className="text-border">·</span>
            <TicketStatusBadge status={t.status} />
            <span className="text-border">·</span>
            <SlaBadge ticket={t} />
            <span className="text-border">·</span>
            <span>{TICKET_TYPE_LABELS[t.type]}</span>
            {t.accountName && (
              <>
                <span className="text-border">·</span>
                <span>{t.accountName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAssign && !t.assignedTo && t.status === "open" && (
            <form action={assignTicketAction}>
              <input type="hidden" name="id" value={t.id} />
              <Button type="submit" size="sm">
                <UserCheck className="size-3.5" /> Assign to me
              </Button>
            </form>
          )}
          {canUpdate && t.status === "assigned" && (
            <StatusButton id={t.id} status="in_progress" label="Start work" icon="play" />
          )}
          {canUpdate && t.status === "resolved" && (
            <StatusButton id={t.id} status="closed" label="Close" icon="check" />
          )}
          {canUpdate && closed && (
            <StatusButton id={t.id} status="in_progress" label="Reopen" icon="reopen" />
          )}
          {canUpdate && (
            <form action={deleteTicketAction}>
              <input type="hidden" name="id" value={t.id} />
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
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">SLA</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <Meta k="Opened" v={fmt(t.openedAt)} />
              <Meta k="Resolve by" v={fmt(t.slaDueAt)} />
              <Meta k="Target" v={`${Math.round(t.slaResolveMins / 60)}h`} />
            </dl>
            {t.description && (
              <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
                {t.description}
              </p>
            )}
          </section>

          {closed ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Resolution</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.resolution ?? "—"}
              </p>
              {t.csat != null && (
                <p className="mt-3 font-mono text-[12px] text-muted-foreground">
                  CSAT: {t.csat}/5
                </p>
              )}
            </section>
          ) : (
            canUpdate && (
              <section className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold">Resolve</h3>
                <div className="mt-3">
                  <ResolveForm ticketId={t.id} />
                </div>
              </section>
            )
          )}
        </div>

        <aside>
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
                      <div className="text-[13px]">{e.type.replace("_", " ")}</div>
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

function StatusButton({
  id,
  status,
  label,
  icon,
}: {
  id: string;
  status: string;
  label: string;
  icon: "play" | "check" | "reopen";
}) {
  return (
    <form action={setTicketStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="outline" size="sm">
        {icon === "play" && <Play className="size-3.5" />}
        {icon === "check" && <Check className="size-3.5" />}
        {icon === "reopen" && <RotateCcw className="size-3.5" />}
        {label}
      </Button>
    </form>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className="mt-0.5 font-mono text-[12px]">{v}</dd>
    </div>
  );
}
