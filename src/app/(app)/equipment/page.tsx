import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryBadge, StockCell } from "@/components/inventory/badges";
import { formatAED } from "@/lib/format";
import {
  EQUIPMENT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategoryKey,
} from "@/modules/inventory/labels";
import { listProducts } from "@/modules/inventory/service";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipment library" };

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = EQUIPMENT_CATEGORIES.includes(sp.cat as ProductCategoryKey)
    ? (sp.cat as ProductCategoryKey)
    : undefined;
  const rows = await listProducts(ctx, { q, category, equipmentOnly: true });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Technical equipment library
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Searchable catalog of controllers, DDCs, sensors, valves, meters and
          more — with model, cost, lead time and stock.
        </p>
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/equipment">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search model, manufacturer, name…"
            className="h-9 w-72 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!category} href="/equipment">
          All
        </Chip>
        {EQUIPMENT_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} href={`/equipment?cat=${c}`}>
            {PRODUCT_CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No equipment matches your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Model</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Manufacturer</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sell</th>
                  <th className="px-4 py-2.5 text-right font-medium">Lead</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px]">
                      <Link href={`/inventory/${p.id}`} className="hover:text-primary">
                        {p.modelNo || p.sku}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {p.manufacturerName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={p.category} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(p.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                      {p.leadTimeDays != null ? `${p.leadTimeDays}d` : "—"}
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
        {rows.length} item{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
        active
          ? "border-primary bg-brand-weak text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
