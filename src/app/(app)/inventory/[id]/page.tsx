import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryBadge, StockCell } from "@/components/inventory/badges";
import { AdjustStockForm } from "@/components/inventory/subforms";
import { formatAED, formatDate } from "@/lib/format";
import { deleteProductAction } from "@/modules/inventory/actions";
import { MOVEMENT_REASON_LABELS } from "@/modules/inventory/labels";
import { getProductFull } from "@/modules/inventory/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getProductFull(ctx, id);
  if (!data) notFound();

  const { product: p, movements } = data;
  const canManage = can(ctx, "inventory.manage");
  const margin =
    p.cost != null && p.sellPrice != null
      ? Number(p.sellPrice) - Number(p.cost)
      : null;
  const specs = (p.specs as Record<string, string> | null) ?? null;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Inventory
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">{p.name}</h2>
            <CategoryBadge category={p.category} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-[12px]">{p.sku}</span>
            {p.manufacturerName && (
              <>
                <span className="text-border">·</span>
                <span>{p.manufacturerName}</span>
              </>
            )}
            {p.modelNo && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-[12px]">{p.modelNo}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {p.datasheetUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={p.datasheetUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> Datasheet
              </a>
            </Button>
          )}
          {canManage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/inventory/${p.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canManage && (
            <form action={deleteProductAction}>
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

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Cost" value={formatAED(p.cost)} />
        <Stat label="Sell price" value={formatAED(p.sellPrice)} />
        <Stat
          label="Margin"
          value={margin != null ? formatAED(margin) : "—"}
          tone={margin != null && margin < 0 ? "text-danger" : "text-success"}
        />
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            On hand
          </div>
          <div className="mt-1">
            <StockCell stock={p.stockQty} reorder={p.reorderLevel} />
          </div>
        </div>
        <Stat
          label="Lead time"
          value={p.leadTimeDays != null ? `${p.leadTimeDays}d` : "—"}
        />
      </div>

      {specs && Object.keys(specs).length > 0 && (
        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Technical specifications</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {Object.entries(specs).map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {k}
                </dt>
                <dd className="mt-0.5 text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Stock ledger</h3>
        {canManage && (
          <div className="mt-3 border-b border-border pb-4">
            <AdjustStockForm productId={p.id} />
          </div>
        )}
        <div className="mt-3 divide-y divide-border">
          {movements.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">
              No stock movements yet.
            </p>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[13px] font-semibold tabular-nums ${m.qtyDelta >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {m.qtyDelta >= 0 ? "+" : ""}
                    {m.qtyDelta}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {MOVEMENT_REASON_LABELS[m.reason]}
                  </span>
                  {m.note && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {m.note}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatDate(m.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
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
