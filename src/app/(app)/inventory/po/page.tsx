import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PoStatusBadge } from "@/components/inventory/badges";
import { formatAED, formatDate } from "@/lib/format";
import { listPurchaseOrders } from "@/modules/inventory/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Purchase orders" };

export default async function PurchaseOrdersPage() {
  const ctx = await requireAuthContext();
  const rows = await listPurchaseOrders(ctx);
  const canCreate = can(ctx, "po.create");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Inventory
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Purchase orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Procurement — receive stock into inventory.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/inventory/po/new">
              <Plus className="size-4" /> New PO
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No purchase orders</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Raise a PO to procure and receive stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Supplier</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Expected</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((po) => (
                  <tr
                    key={po.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/inventory/po/${po.id}`}
                        className="font-mono text-[12px] font-medium hover:text-primary"
                      >
                        {po.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {po.supplierName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(po.total)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {po.expectedDate ? formatDate(po.expectedDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PoStatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
