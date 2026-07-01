import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContractStatusBadge,
  ContractTypeBadge,
  VisitStatusBadge,
} from "@/components/contracts/badges";
import { AddAssetForm, ScheduleVisitForm } from "@/components/contracts/subforms";
import { formatAED, formatDate } from "@/lib/format";
import {
  completeVisitAction,
  deleteContractAction,
} from "@/modules/contracts/actions";
import { ASSET_CATEGORY_LABELS } from "@/modules/contracts/labels";
import {
  contractActivity,
  getContractFull,
} from "@/modules/contracts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getContractFull(ctx, id);
  if (!data) notFound();

  const { contract: c, assets, visits } = data;
  const activity = await contractActivity(ctx, id);
  const canUpdate = can(ctx, "contract.update");
  const canDelete = can(ctx, "contract.delete");
  const canAssets = can(ctx, "asset.manage");
  const canSchedule = can(ctx, "ppm.schedule");
  const profit =
    c.value != null && c.annualCost != null
      ? Number(c.value) - Number(c.annualCost)
      : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> AMC &amp; PPM
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">{c.title}</h2>
            <ContractTypeBadge type={c.type} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{c.number}</span>
            <span className="text-border">·</span>
            <ContractStatusBadge status={c.status} />
            {c.accountName && (
              <>
                <span className="text-border">·</span>
                <span>{c.accountName}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/contracts/${c.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <form action={deleteContractAction}>
              <input type="hidden" name="id" value={c.id} />
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

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Contract value" value={formatAED(c.value)} />
        <Stat label="Annual cost" value={formatAED(c.annualCost)} />
        <Stat
          label="Profitability"
          value={profit != null ? formatAED(profit) : "—"}
          tone={profit != null && profit < 0 ? "text-danger" : "text-success"}
        />
        <Stat
          label="Renewal"
          value={c.renewalReminderAt ? formatDate(c.renewalReminderAt) : "—"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Assets */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Asset registry</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {assets.length}
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            {assets.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                No assets registered.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-1.5 pr-3 font-medium">Asset</th>
                    <th className="py-1.5 pr-3 font-medium">Category</th>
                    <th className="py-1.5 pr-3 font-medium">Model</th>
                    <th className="py-1.5 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 font-medium">{a.name}</td>
                      <td className="py-2 pr-3 text-[12px] text-muted-foreground">
                        {ASSET_CATEGORY_LABELS[a.category]}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">
                        {a.model || "—"}
                      </td>
                      <td className="py-2 text-[12px] text-muted-foreground">
                        {a.location || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {canAssets && (
            <div className="mt-4 border-t border-border pt-4">
              <AddAssetForm contractId={c.id} />
            </div>
          )}
        </section>

        {/* PPM visits */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">PPM visits</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {visits.length}
            </span>
          </div>
          <div className="mt-3 divide-y divide-border">
            {visits.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                No visits scheduled.
              </p>
            ) : (
              visits.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div>
                    <div className="font-mono text-[13px]">
                      {formatDate(v.scheduledDate)}
                    </div>
                    <VisitStatusBadge status={v.status} />
                  </div>
                  {canSchedule && (
                    <form action={completeVisitAction}>
                      <input type="hidden" name="visitId" value={v.id} />
                      <input type="hidden" name="contractId" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {v.status === "completed" ? (
                          <>
                            <RotateCcw className="size-3.5" /> Reopen
                          </>
                        ) : (
                          <>
                            <Check className="size-3.5" /> Done
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
          {canSchedule && (
            <div className="mt-4 border-t border-border pt-4">
              <ScheduleVisitForm contractId={c.id} />
            </div>
          )}
        </section>
      </div>

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
                    {e.type === "created" ? "Contract created" : e.type}
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
