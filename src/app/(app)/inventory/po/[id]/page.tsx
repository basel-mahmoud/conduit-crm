import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageCheck, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PoStatusBadge } from "@/components/inventory/badges";
import { AddPoLineForm } from "@/components/inventory/subforms";
import { formatAED, formatDate } from "@/lib/format";
import {
  deletePoAction,
  receivePoAction,
  setPoStatusAction,
} from "@/modules/inventory/actions";
import {
  getPurchaseOrderFull,
  listProductOptions,
} from "@/modules/inventory/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

export default async function PoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getPurchaseOrderFull(ctx, id);
  if (!data) notFound();

  const { po, lines } = data;
  const products = await listProductOptions(ctx);
  const canManage = can(ctx, "po.create");
  const canReceive = can(ctx, "po.approve");
  const open = po.status !== "received" && po.status !== "cancelled";

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/inventory/po"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Purchase orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-mono text-2xl font-semibold tracking-tight">
              {po.number}
            </h2>
            <PoStatusBadge status={po.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{po.supplierName ?? "No supplier"}</span>
            <span className="text-border">·</span>
            <span className="font-mono">Total {formatAED(po.total)}</span>
            {po.expectedDate && (
              <>
                <span className="text-border">·</span>
                <span>Expected {formatDate(po.expectedDate)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && po.status === "draft" && (
            <form action={setPoStatusAction}>
              <input type="hidden" name="id" value={po.id} />
              <input type="hidden" name="status" value="ordered" />
              <Button type="submit" variant="outline" size="sm">
                <Send className="size-3.5" /> Mark ordered
              </Button>
            </form>
          )}
          {canReceive && open && (
            <form action={receivePoAction}>
              <input type="hidden" name="id" value={po.id} />
              <Button
                type="submit"
                size="sm"
                className="bg-success text-white hover:bg-success/90"
              >
                <PackageCheck className="size-3.5" /> Receive → stock
              </Button>
            </form>
          )}
          {canManage && (
            <form action={deletePoAction}>
              <input type="hidden" name="id" value={po.id} />
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

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium">Unit cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No lines yet.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{l.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px]">
                      {l.qty}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] text-muted-foreground">
                      {formatAED(l.unitCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] font-semibold tabular-nums">
                      {formatAED(l.lineTotal)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-mono text-[11px] ${l.received ? "text-success" : "text-muted-foreground"}`}
                      >
                        {l.received ? "received" : "pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {canManage && open && (
          <div className="border-t border-border p-4">
            <AddPoLineForm poId={po.id} products={products} />
          </div>
        )}
      </section>
    </div>
  );
}
