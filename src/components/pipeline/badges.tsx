import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONE,
  type LeadStatusKey,
} from "@/modules/leads/labels";
import {
  STAGE_META,
  type OppStageKey,
} from "@/modules/opportunities/labels";
import {
  PROJECT_TYPE_LABELS,
  type ProjectTypeKey,
} from "@/modules/shared/project-types";

export function ProjectTypeBadge({ type }: { type: ProjectTypeKey }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
      {PROJECT_TYPE_LABELS[type]}
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: LeadStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        LEAD_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: OppStageKey }) {
  const m = STAGE_META[stage];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
      <span
        className="size-2 rounded-full"
        style={{ background: m.color }}
      />
      {m.label}
    </span>
  );
}
