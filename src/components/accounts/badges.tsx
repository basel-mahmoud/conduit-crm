import { cn } from "@/lib/utils";
import {
  ACCOUNT_TYPE_LABELS,
  RATING_LABELS,
  type AccountTypeKey,
  type RatingKey,
} from "@/modules/accounts/labels";

export function AccountTypeBadge({ type }: { type: AccountTypeKey }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
      {ACCOUNT_TYPE_LABELS[type]}
    </span>
  );
}

export function RatingBadge({ rating }: { rating: RatingKey }) {
  const tone =
    rating === "a"
      ? "text-success"
      : rating === "b"
        ? "text-muted-foreground"
        : "text-warning";
  return (
    <span
      className={cn("font-mono text-[11px] font-semibold", tone)}
      title={RATING_LABELS[rating]}
    >
      {rating.toUpperCase()}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        status === "active" ? "text-success" : "text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
