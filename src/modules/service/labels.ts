export const TICKET_PRIORITIES = ["p1", "p2", "p3", "p4"] as const;
export type PriorityKey = (typeof TICKET_PRIORITIES)[number];
export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  p1: "P1 · Critical",
  p2: "P2 · High",
  p3: "P3 · Medium",
  p4: "P4 · Low",
};
export const PRIORITY_TONE: Record<PriorityKey, string> = {
  p1: "text-danger",
  p2: "text-warning",
  p3: "text-[var(--brand)]",
  p4: "text-muted-foreground",
};

/** SLA response/resolve targets (minutes) by priority. */
export const SLA_TARGETS: Record<
  PriorityKey,
  { responseMins: number; resolveMins: number }
> = {
  p1: { responseMins: 60, resolveMins: 240 },
  p2: { responseMins: 240, resolveMins: 1440 },
  p3: { responseMins: 480, resolveMins: 2880 },
  p4: { responseMins: 1440, resolveMins: 7200 },
};

export const TICKET_TYPES = ["breakdown", "request", "ppm"] as const;
export type TicketTypeKey = (typeof TICKET_TYPES)[number];
export const TICKET_TYPE_LABELS: Record<TicketTypeKey, string> = {
  breakdown: "Breakdown",
  request: "Request",
  ppm: "PPM",
};

export const TICKET_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type TicketStatusKey = (typeof TICKET_STATUSES)[number];
export const TICKET_STATUS_LABELS: Record<TicketStatusKey, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
export const TICKET_STATUS_TONE: Record<TicketStatusKey, string> = {
  open: "text-danger",
  assigned: "text-warning",
  in_progress: "text-[var(--brand)]",
  resolved: "text-success",
  closed: "text-muted-foreground",
};

export type SlaState = "on_track" | "due_soon" | "breached" | "met";
export const SLA_LABELS: Record<SlaState, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  breached: "Breached",
  met: "Met",
};
export const SLA_TONE: Record<SlaState, string> = {
  on_track: "text-success",
  due_soon: "text-warning",
  breached: "text-danger",
  met: "text-muted-foreground",
};

export function slaState(t: {
  status: string;
  slaDueAt: Date | string | null;
  resolvedAt: Date | string | null;
}): SlaState {
  if (t.status === "resolved" || t.status === "closed") return "met";
  if (!t.slaDueAt) return "on_track";
  const due = new Date(t.slaDueAt).getTime();
  const now = Date.now();
  if (now > due) return "breached";
  if (due - now < 60 * 60 * 1000) return "due_soon";
  return "on_track";
}
