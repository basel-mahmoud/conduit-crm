/**
 * Permission catalog — the single source of truth for `resource.action` grants.
 * Seeded into the `permissions` table; referenced by the role matrix and guard.
 *
 * Record scope (own | team | branch | org) is applied per role grant, not here.
 * Field-level financial visibility is modelled as the `quotation.cost.view`
 * permission (gates cost/margin columns in serializers).
 */
export const SCOPES = ["own", "team", "branch", "org"] as const;
export type Scope = (typeof SCOPES)[number];

/** Higher index = wider visibility. Used to compare/maximise scopes. */
export const SCOPE_RANK: Record<Scope, number> = {
  own: 0,
  team: 1,
  branch: 2,
  org: 3,
};

export const PERMISSION_DEFS = [
  // Customer database
  { key: "account.create", resource: "account", action: "create" },
  { key: "account.read", resource: "account", action: "read" },
  { key: "account.update", resource: "account", action: "update" },
  { key: "account.delete", resource: "account", action: "delete" },
  { key: "contact.manage", resource: "contact", action: "manage" },
  // Leads
  { key: "lead.create", resource: "lead", action: "create" },
  { key: "lead.read", resource: "lead", action: "read" },
  { key: "lead.update", resource: "lead", action: "update" },
  { key: "lead.delete", resource: "lead", action: "delete" },
  { key: "lead.convert", resource: "lead", action: "convert" },
  // Opportunities
  { key: "opportunity.create", resource: "opportunity", action: "create" },
  { key: "opportunity.read", resource: "opportunity", action: "read" },
  { key: "opportunity.update", resource: "opportunity", action: "update" },
  { key: "opportunity.delete", resource: "opportunity", action: "delete" },
  // Quotations
  { key: "quotation.create", resource: "quotation", action: "create" },
  { key: "quotation.read", resource: "quotation", action: "read" },
  { key: "quotation.update", resource: "quotation", action: "update" },
  { key: "quotation.delete", resource: "quotation", action: "delete" },
  { key: "quotation.send", resource: "quotation", action: "send" },
  // Field-level: see cost build-up & margin
  { key: "quotation.cost.view", resource: "quotation.cost", action: "view" },
  // Discount approval workflow
  { key: "discount.approve", resource: "discount", action: "approve" },
  // Projects
  { key: "project.create", resource: "project", action: "create" },
  { key: "project.read", resource: "project", action: "read" },
  { key: "project.update", resource: "project", action: "update" },
  { key: "project.delete", resource: "project", action: "delete" },
  // AMC / PPM contracts
  { key: "contract.create", resource: "contract", action: "create" },
  { key: "contract.read", resource: "contract", action: "read" },
  { key: "contract.update", resource: "contract", action: "update" },
  { key: "contract.delete", resource: "contract", action: "delete" },
  { key: "ppm.schedule", resource: "ppm", action: "schedule" },
  { key: "asset.manage", resource: "asset", action: "manage" },
  // Service
  { key: "ticket.create", resource: "ticket", action: "create" },
  { key: "ticket.read", resource: "ticket", action: "read" },
  { key: "ticket.update", resource: "ticket", action: "update" },
  { key: "ticket.assign", resource: "ticket", action: "assign" },
  // Inventory / trading / equipment
  { key: "inventory.read", resource: "inventory", action: "read" },
  { key: "inventory.manage", resource: "inventory", action: "manage" },
  { key: "po.create", resource: "po", action: "create" },
  { key: "po.approve", resource: "po", action: "approve" },
  { key: "equipment.read", resource: "equipment", action: "read" },
  { key: "equipment.manage", resource: "equipment", action: "manage" },
  // Reporting
  { key: "report.view", resource: "report", action: "view" },
  { key: "report.financial.view", resource: "report.financial", action: "view" },
  // Administration
  { key: "user.manage", resource: "user", action: "manage" },
  { key: "role.manage", resource: "role", action: "manage" },
  { key: "audit.view", resource: "audit", action: "view" },
  { key: "setting.manage", resource: "setting", action: "manage" },
  { key: "org.manage", resource: "org", action: "manage" },
] as const;

export type PermissionDef = (typeof PERMISSION_DEFS)[number];
export type PermissionKey = PermissionDef["key"];

export const ALL_PERMISSION_KEYS = PERMISSION_DEFS.map(
  (p) => p.key,
) as PermissionKey[];

export function permissionDescription(def: PermissionDef): string {
  return `${def.action} ${def.resource}`;
}
