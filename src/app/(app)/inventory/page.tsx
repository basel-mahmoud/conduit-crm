import Link from "next/link";
import { Plus, Search, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryBadge, StockCell } from "@/components/inventory/badges";
import { formatAED } from "@/lib/format";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategoryKey,
} from "@/modules/inventory/labels";
import { listProducts } from "@/modules/inventory/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; low?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = (PRODUCT_CATEGORIES as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as ProductCategoryKey)
    : undefined;
  const lowStock = sp.low === "1";
  const rows = await listProducts(ctx, { q, category, lowStock });
  const canCreate = can(ctx, "inventory.manage");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Product & equipment catalog with stock tracking and reorder alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory/po">
              <ShoppingCart className="size-4" /> Purchase orders
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/inventory/new">
                <Plus className="size-4" /> New product
              </Link>
            </Button>
          )}
        </div>
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/inventory">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search SKU, name, model…"
            className="h-9 w-72 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {category && <input type="hidden" name="cat" value={category} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!category && !lowStock} href="/inventory">
          All
        </Chip>
        <Chip active={lowStock} href="/inventory?low=1" tone="danger">
          Low stock
        </Chip>
        {PRODUCT_CATEGORIES.slice(0, 10).map((c) => (
          <Chip key={c} active={category === c} href={`/inventory?cat=${c}`}>
            {PRODUCT_CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No products</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || category || lowStock
                ? "No products match your filters."
                : "Add products to build the catalog."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">SKU</th>
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Manufacturer</th>
                  <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sell</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/inventory/${p.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {p.name}
                      </Link>
                      {p.modelNo && (
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                          {p.modelNo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={p.category} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {p.manufacturerName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                      {formatAED(p.cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(p.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StockCell stock={p.stockQty} reorder={p.reorderLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} product{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function Chip({
  active,
  href,
  children,
  tone,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
        active
          ? tone === "danger"
            ? "border-danger bg-danger/10 text-danger"
            : "border-primary bg-brand-weak text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
