export const OPP_STAGES = [
  "new",
  "qualified",
  "budgetary",
  "technical",
  "commercial",
  "negotiation",
  "awaiting_po",
  "won",
  "lost",
] as const;
export type OppStageKey = (typeof OPP_STAGES)[number];

export interface StageMeta {
  label: string;
  /** Default win probability when an opp enters this stage. */
  probability: number;
  /** Accent color for board column / badge. */
  color: string;
}

export const STAGE_META: Record<OppStageKey, StageMeta> = {
  new: { label: "New Lead", probability: 10, color: "var(--muted)" },
  qualified: { label: "Qualified", probability: 25, color: "var(--brand)" },
  budgetary: { label: "Budgetary Offer", probability: 35, color: "#7C5CFC" },
  technical: { label: "Technical Submission", probability: 50, color: "#0EA5A0" },
  commercial: { label: "Commercial Offer", probability: 65, color: "#2D6BE4" },
  negotiation: { label: "Negotiation", probability: 80, color: "var(--warning)" },
  awaiting_po: { label: "Awaiting PO", probability: 90, color: "#E8A317" },
  won: { label: "Won", probability: 100, color: "var(--success)" },
  lost: { label: "Lost", probability: 0, color: "var(--danger)" },
};

/** Columns shown on the kanban, left→right. */
export const PIPELINE_COLUMNS = OPP_STAGES;

export const OPEN_STAGES = OPP_STAGES.filter(
  (s) => s !== "won" && s !== "lost",
);

export const APPROVALS = ["na", "pending", "approved", "rejected"] as const;
export type ApprovalKey = (typeof APPROVALS)[number];
export const APPROVAL_LABELS: Record<ApprovalKey, string> = {
  na: "N/A",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
export const APPROVAL_TONE: Record<ApprovalKey, string> = {
  na: "text-muted-foreground",
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-danger",
};
