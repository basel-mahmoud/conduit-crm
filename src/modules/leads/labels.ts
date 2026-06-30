export const LEAD_SOURCES = [
  "referral",
  "website",
  "existing_client",
  "consultant",
  "tender",
  "cold_outreach",
  "other",
] as const;
export type LeadSourceKey = (typeof LEAD_SOURCES)[number];
export const LEAD_SOURCE_LABELS: Record<LeadSourceKey, string> = {
  referral: "Referral",
  website: "Website",
  existing_client: "Existing Client",
  consultant: "Consultant",
  tender: "Tender",
  cold_outreach: "Cold Outreach",
  other: "Other",
};

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
] as const;
export type LeadStatusKey = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABELS: Record<LeadStatusKey, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};
export const LEAD_STATUS_TONE: Record<LeadStatusKey, string> = {
  new: "text-[var(--brand)]",
  contacted: "text-[var(--accent)]",
  qualified: "text-success",
  unqualified: "text-muted-foreground",
  converted: "text-primary",
};
