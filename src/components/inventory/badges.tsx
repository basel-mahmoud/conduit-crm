import { cn } from "@/lib/utils";
import {
  PO_STATUS_LABELS,
  PO_STATUS_TONE,
  PRODUCT_CATEGORY_LABELS,
  type PoStatusKey,
  type ProductCategoryKey,
} from "@/modules/inventory/labels";

export function CategoryBadge({ category }: { category: ProductCategoryKey }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
      {PRODUCT_CATEGORY_LABELS[category]}
    </span>
  );
}

export function PoStatusBadge({ status }: { status: PoStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        PO_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {PO_STATUS_LABELS[status]}
    </span>
  );
}

export function StockCell({
  stock,
  reorder,
}: {
  stock: number;
  reorder: number;
}) {
  const low = reorder > 0 && stock <= reorder;
  return (
    <span
      className={cn(
        "font-mono text-[12px] font-semibold tabular-nums",
        low ? "text-danger" : "text-foreground",
      )}
    >
      {stock}
      {low && (
        <span className="ml-1 font-normal text-[10px] uppercase">low</span>
      )}
    </span>
  );
}
