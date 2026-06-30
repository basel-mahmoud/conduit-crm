/** Project/system types — shared across leads, opportunities, quotations, projects. */
export const PROJECT_TYPES = [
  "bms",
  "lcs",
  "home_automation",
  "ems",
  "btu",
  "hvac_controls",
  "elv",
  "other",
] as const;

export type ProjectTypeKey = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectTypeKey, string> = {
  bms: "BMS",
  lcs: "Lighting Control",
  home_automation: "Home Automation",
  ems: "EMS",
  btu: "BTU Metering",
  hvac_controls: "HVAC Controls",
  elv: "ELV",
  other: "Other",
};
