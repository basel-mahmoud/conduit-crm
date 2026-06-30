export const PROJECT_STATUSES = [
  "registered",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;
export type ProjectStatusKey = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatusKey, string> = {
  registered: "Registered",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const PROJECT_STATUS_TONE: Record<ProjectStatusKey, string> = {
  registered: "text-[var(--brand)]",
  in_progress: "text-[var(--accent)]",
  on_hold: "text-warning",
  completed: "text-success",
  cancelled: "text-muted-foreground",
};

export const HEALTHS = ["on_track", "at_risk", "delayed"] as const;
export type HealthKey = (typeof HEALTHS)[number];
export const HEALTH_LABELS: Record<HealthKey, string> = {
  on_track: "On track",
  at_risk: "At risk",
  delayed: "Delayed",
};
export const HEALTH_TONE: Record<HealthKey, string> = {
  on_track: "text-success",
  at_risk: "text-warning",
  delayed: "text-danger",
};

export const PHASE_KINDS = [
  "procurement",
  "engineering",
  "installation",
  "testing_commissioning",
  "handover",
] as const;
export type PhaseKindKey = (typeof PHASE_KINDS)[number];
export const PHASE_LABELS: Record<PhaseKindKey, string> = {
  procurement: "Procurement",
  engineering: "Engineering",
  installation: "Installation",
  testing_commissioning: "Testing & Commissioning",
  handover: "Handover",
};

export const PHASE_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
] as const;
export type PhaseStatusKey = (typeof PHASE_STATUSES)[number];
export const PHASE_STATUS_LABELS: Record<PhaseStatusKey, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

export const SNAG_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type SnagSeverityKey = (typeof SNAG_SEVERITIES)[number];
export const SNAG_SEVERITY_TONE: Record<SnagSeverityKey, string> = {
  low: "text-muted-foreground",
  medium: "text-[var(--brand)]",
  high: "text-warning",
  critical: "text-danger",
};

export const SNAG_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type SnagStatusKey = (typeof SNAG_STATUSES)[number];
export const SNAG_STATUS_LABELS: Record<SnagStatusKey, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
