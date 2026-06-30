/** Display metadata for accounts — shared by forms, lists, and detail views. */
export const ACCOUNT_TYPES = [
  "end_user",
  "consultant",
  "contractor",
  "developer",
  "fm",
  "mep",
  "supplier",
  "brand_partner",
] as const;

export type AccountTypeKey = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeKey, string> = {
  end_user: "End User",
  consultant: "Consultant",
  contractor: "Contractor",
  developer: "Developer",
  fm: "Facility Mgmt",
  mep: "MEP Contractor",
  supplier: "Supplier",
  brand_partner: "Brand Partner",
};

export const RATINGS = ["a", "b", "c"] as const;
export type RatingKey = (typeof RATINGS)[number];
export const RATING_LABELS: Record<RatingKey, string> = {
  a: "A — Key account",
  b: "B — Standard",
  c: "C — Low priority",
};
