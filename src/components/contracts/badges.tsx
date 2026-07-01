import { cn } from "@/lib/utils";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_TONE,
  CONTRACT_TYPE_LABELS,
  VISIT_STATUS_LABELS,
  VISIT_STATUS_TONE,
  type ContractStatusKey,
  type ContractTypeKey,
  type VisitStatusKey,
} from "@/modules/contracts/labels";

export function ContractTypeBadge({ type }: { type: ContractTypeKey }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
      {CONTRACT_TYPE_LABELS[type]}
    </span>
  );
}

export function ContractStatusBadge({ status }: { status: ContractStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        CONTRACT_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatusKey }) {
  return (
    <span className={cn("font-mono text-[11px]", VISIT_STATUS_TONE[status])}>
      {VISIT_STATUS_LABELS[status]}
    </span>
  );
}
