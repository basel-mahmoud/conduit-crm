export const PRODUCT_CATEGORIES = [
  "controller",
  "ddc",
  "sensor",
  "actuator",
  "valve",
  "thermostat",
  "vfd",
  "btu_meter",
  "lighting_ctrl",
  "home_auto",
  "panel",
  "cable",
  "accessory",
  "other",
] as const;
export type ProductCategoryKey = (typeof PRODUCT_CATEGORIES)[number];
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryKey, string> = {
  controller: "Controller",
  ddc: "DDC",
  sensor: "Sensor",
  actuator: "Actuator",
  valve: "Valve",
  thermostat: "Thermostat",
  vfd: "VFD",
  btu_meter: "BTU Meter",
  lighting_ctrl: "Lighting Ctrl",
  home_auto: "Home Automation",
  panel: "Panel",
  cable: "Cable",
  accessory: "Accessory",
  other: "Other",
};

/** Categories treated as the technical-equipment library. */
export const EQUIPMENT_CATEGORIES: ProductCategoryKey[] = [
  "controller",
  "ddc",
  "sensor",
  "actuator",
  "valve",
  "thermostat",
  "vfd",
  "btu_meter",
  "lighting_ctrl",
  "home_auto",
];

export const PRODUCT_STATUSES = ["active", "discontinued"] as const;
export type ProductStatusKey = (typeof PRODUCT_STATUSES)[number];

export const MOVEMENT_REASONS = [
  "purchase",
  "sale",
  "adjustment",
  "consumption",
  "return",
] as const;
export type MovementReasonKey = (typeof MOVEMENT_REASONS)[number];
export const MOVEMENT_REASON_LABELS: Record<MovementReasonKey, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  consumption: "Consumption",
  return: "Return",
};

export const PO_STATUSES = [
  "draft",
  "ordered",
  "received",
  "cancelled",
] as const;
export type PoStatusKey = (typeof PO_STATUSES)[number];
export const PO_STATUS_LABELS: Record<PoStatusKey, string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};
export const PO_STATUS_TONE: Record<PoStatusKey, string> = {
  draft: "text-muted-foreground",
  ordered: "text-warning",
  received: "text-success",
  cancelled: "text-danger",
};

export const PRODUCT_UNITS = [
  "nos",
  "set",
  "m",
  "roll",
  "box",
  "pair",
] as const;
