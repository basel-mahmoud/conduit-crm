export const QUOTATION_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "sent",
  "won",
  "lost",
  "expired",
] as const;
export type QuotationStatusKey = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABELS: Record<QuotationStatusKey, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
  expired: "Expired",
};

export const QUOTATION_STATUS_TONE: Record<QuotationStatusKey, string> = {
  draft: "text-muted-foreground",
  in_review: "text-warning",
  approved: "text-[var(--accent)]",
  sent: "text-[var(--brand)]",
  won: "text-success",
  lost: "text-danger",
  expired: "text-muted-foreground",
};

export const UNITS = [
  "nos",
  "set",
  "lot",
  "point",
  "panel",
  "m",
  "m²",
  "hour",
  "day",
] as const;
