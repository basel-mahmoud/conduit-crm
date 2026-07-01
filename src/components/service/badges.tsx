import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PRIORITY_TONE,
  SLA_LABELS,
  SLA_TONE,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONE,
  slaState,
  type PriorityKey,
  type TicketStatusKey,
} from "@/modules/service/labels";

export function PriorityBadge({ priority }: { priority: PriorityKey }) {
  return (
    <span className={cn("font-mono text-[11px] font-semibold", PRIORITY_TONE[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        TICKET_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

export function SlaBadge({
  ticket,
}: {
  ticket: {
    status: string;
    slaDueAt: Date | string | null;
    resolvedAt: Date | string | null;
  };
}) {
  const s = slaState(ticket);
  return (
    <span className={cn("font-mono text-[11px] font-medium", SLA_TONE[s])}>
      {SLA_LABELS[s]}
    </span>
  );
}
