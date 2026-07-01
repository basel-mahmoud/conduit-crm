export const CONTRACT_TYPES = ["amc", "ppm"] as const;
export type ContractTypeKey = (typeof CONTRACT_TYPES)[number];
export const CONTRACT_TYPE_LABELS: Record<ContractTypeKey, string> = {
  amc: "AMC",
  ppm: "PPM",
};

export const CONTRACT_STATUSES = [
  "draft",
  "active",
  "expiring",
  "expired",
  "renewed",
  "cancelled",
] as const;
export type ContractStatusKey = (typeof CONTRACT_STATUSES)[number];
export const CONTRACT_STATUS_LABELS: Record<ContractStatusKey, string> = {
  draft: "Draft",
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  renewed: "Renewed",
  cancelled: "Cancelled",
};
export const CONTRACT_STATUS_TONE: Record<ContractStatusKey, string> = {
  draft: "text-muted-foreground",
  active: "text-success",
  expiring: "text-warning",
  expired: "text-danger",
  renewed: "text-[var(--brand)]",
  cancelled: "text-muted-foreground",
};

export const PPM_FREQUENCIES = [
  "monthly",
  "quarterly",
  "biannual",
  "annual",
] as const;
export type PpmFrequencyKey = (typeof PPM_FREQUENCIES)[number];
export const PPM_FREQUENCY_LABELS: Record<PpmFrequencyKey, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Bi-annual",
  annual: "Annual",
};

export const ASSET_CATEGORIES = [
  "controller",
  "ddc",
  "sensor",
  "actuator",
  "valve",
  "thermostat",
  "vfd",
  "btu_meter",
  "lighting_ctrl",
  "hvac",
  "other",
] as const;
export type AssetCategoryKey = (typeof ASSET_CATEGORIES)[number];
export const ASSET_CATEGORY_LABELS: Record<AssetCategoryKey, string> = {
  controller: "Controller",
  ddc: "DDC",
  sensor: "Sensor",
  actuator: "Actuator",
  valve: "Valve",
  thermostat: "Thermostat",
  vfd: "VFD",
  btu_meter: "BTU Meter",
  lighting_ctrl: "Lighting Ctrl",
  hvac: "HVAC Unit",
  other: "Other",
};

export const ASSET_STATUSES = ["active", "faulty", "decommissioned"] as const;
export type AssetStatusKey = (typeof ASSET_STATUSES)[number];
export const ASSET_STATUS_TONE: Record<AssetStatusKey, string> = {
  active: "text-success",
  faulty: "text-danger",
  decommissioned: "text-muted-foreground",
};

export const VISIT_STATUSES = [
  "planned",
  "completed",
  "missed",
  "rescheduled",
] as const;
export type VisitStatusKey = (typeof VISIT_STATUSES)[number];
export const VISIT_STATUS_LABELS: Record<VisitStatusKey, string> = {
  planned: "Planned",
  completed: "Completed",
  missed: "Missed",
  rescheduled: "Rescheduled",
};
export const VISIT_STATUS_TONE: Record<VisitStatusKey, string> = {
  planned: "text-[var(--brand)]",
  completed: "text-success",
  missed: "text-danger",
  rescheduled: "text-warning",
};
