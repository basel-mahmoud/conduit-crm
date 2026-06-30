import { cn } from "@/lib/utils";
import {
  HEALTH_LABELS,
  HEALTH_TONE,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONE,
  SNAG_SEVERITY_TONE,
  SNAG_STATUS_LABELS,
  type HealthKey,
  type ProjectStatusKey,
  type SnagSeverityKey,
  type SnagStatusKey,
} from "@/modules/projects/labels";

export function ProjectStatusBadge({ status }: { status: ProjectStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px]",
        PROJECT_STATUS_TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function HealthBadge({ health }: { health: HealthKey }) {
  return (
    <span
      className={cn("font-mono text-[11px] font-medium", HEALTH_TONE[health])}
    >
      {HEALTH_LABELS[health]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: SnagSeverityKey }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-semibold uppercase",
        SNAG_SEVERITY_TONE[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function SnagStatusBadge({ status }: { status: SnagStatusKey }) {
  const tone =
    status === "open"
      ? "text-danger"
      : status === "in_progress"
        ? "text-warning"
        : status === "resolved"
          ? "text-success"
          : "text-muted-foreground";
  return (
    <span className={cn("font-mono text-[11px]", tone)}>
      {SNAG_STATUS_LABELS[status]}
    </span>
  );
}
