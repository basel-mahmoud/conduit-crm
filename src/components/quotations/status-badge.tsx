import { cn } from "@/lib/utils";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_TONE,
  type QuotationStatusKey,
} from "@/modules/quotations/labels";

export function QuotationStatusBadge({
  status,
}: {
  status: QuotationStatusKey;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        QUOTATION_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {QUOTATION_STATUS_LABELS[status]}
    </span>
  );
}
