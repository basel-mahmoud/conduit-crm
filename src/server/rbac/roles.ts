/**
 * The 11 system roles and their permission grants (with record scope).
 * This is the machine-readable permission matrix; it is seeded into
 * `roles` + `role_permissions` and is also the source the guard evaluates.
 *
 * Field-level financial visibility = presence of `quotation.cost.view`.
 */
import {
  ALL_PERMISSION_KEYS,
  SCOPE_RANK,
  type PermissionKey,
  type Scope,
} from "./permissions";

export const ROLE_KEYS = [
  "admin",
  "managing_director",
  "general_manager",
  "sales_manager",
  "sales_engineer",
  "estimation_engineer",
  "project_manager",
  "service_manager",
  "service_engineer",
  "procurement_officer",
  "accountant",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export interface SystemRole {
  key: RoleKey;
  name: string;
  description: string;
  /** Grant → record scope. Absent key = not granted. */
  grants: Partial<Record<PermissionKey, Scope>>;
}

type Grants = Partial<Record<PermissionKey, Scope>>;

const everything: Grants = Object.fromEntries(
  ALL_PERMISSION_KEYS.map((k) => [k, "org" as Scope]),
);

/** Read-only org-wide view of the whole pipeline + financials. */
const orgWideRead: Grants = {
  "account.read": "org",
  "lead.read": "org",
  "opportunity.read": "org",
  "quotation.read": "org",
  "quotation.cost.view": "org",
  "project.read": "org",
  "contract.read": "org",
  "ticket.read": "org",
  "inventory.read": "org",
  "equipment.read": "org",
  "report.view": "org",
  "report.financial.view": "org",
};

export const SYSTEM_ROLES: SystemRole[] = [
  {
    key: "admin",
    name: "Administrator",
    description: "Full system access, user & role administration.",
    grants: everything,
  },
  {
    key: "managing_director",
    name: "Managing Director",
    description: "Org-wide visibility, approvals, and audit oversight.",
    grants: {
      ...orgWideRead,
      "discount.approve": "org",
      "po.approve": "org",
      "audit.view": "org",
    },
  },
  {
    key: "general_manager",
    name: "General Manager",
    description: "Org-wide oversight with operational edit rights and approvals.",
    grants: {
      ...orgWideRead,
      "account.update": "org",
      "opportunity.update": "org",
      "project.update": "org",
      "contract.update": "org",
      "discount.approve": "org",
      "po.approve": "org",
      "audit.view": "org",
    },
  },
  {
    key: "sales_manager",
    name: "Sales Manager",
    description: "Owns the sales team's pipeline, quotations, and discounting.",
    grants: {
      "account.create": "team",
      "account.read": "team",
      "account.update": "team",
      "contact.manage": "team",
      "lead.create": "team",
      "lead.read": "team",
      "lead.update": "team",
      "lead.delete": "team",
      "lead.convert": "team",
      "opportunity.create": "team",
      "opportunity.read": "team",
      "opportunity.update": "team",
      "opportunity.delete": "team",
      "quotation.create": "team",
      "quotation.read": "team",
      "quotation.update": "team",
      "quotation.send": "team",
      "quotation.cost.view": "team",
      "discount.approve": "team",
      "report.view": "team",
    },
  },
  {
    key: "sales_engineer",
    name: "Sales Engineer",
    description: "Works own leads, opportunities, and quotations (no cost view).",
    grants: {
      "account.create": "own",
      "account.read": "team",
      "contact.manage": "own",
      "lead.create": "own",
      "lead.read": "own",
      "lead.update": "own",
      "lead.convert": "own",
      "opportunity.create": "own",
      "opportunity.read": "own",
      "opportunity.update": "own",
      "quotation.create": "own",
      "quotation.read": "own",
      "quotation.update": "own",
      "report.view": "own",
    },
  },
  {
    key: "estimation_engineer",
    name: "Estimation Engineer",
    description: "Builds quotations with full cost build-up and margin.",
    grants: {
      "account.read": "team",
      "lead.read": "team",
      "opportunity.read": "team",
      "quotation.create": "team",
      "quotation.read": "team",
      "quotation.update": "team",
      "quotation.cost.view": "team",
      "equipment.read": "org",
      "inventory.read": "org",
      "report.view": "team",
    },
  },
  {
    key: "project_manager",
    name: "Project Manager",
    description: "Runs awarded projects, milestones, snags, and handover.",
    grants: {
      "account.read": "team",
      "opportunity.read": "team",
      "quotation.read": "team",
      "project.create": "own",
      "project.read": "own",
      "project.update": "own",
      "contract.read": "team",
      "ticket.read": "team",
      "inventory.read": "org",
      "equipment.read": "org",
      "report.view": "team",
    },
  },
  {
    key: "service_manager",
    name: "Service Manager",
    description: "Owns AMC/PPM contracts, service tickets, and dispatch.",
    grants: {
      "account.read": "org",
      "contract.create": "org",
      "contract.read": "org",
      "contract.update": "org",
      "contract.delete": "org",
      "ppm.schedule": "org",
      "asset.manage": "org",
      "ticket.create": "org",
      "ticket.read": "org",
      "ticket.update": "org",
      "ticket.assign": "org",
      "inventory.read": "org",
      "report.view": "org",
    },
  },
  {
    key: "service_engineer",
    name: "Service Engineer",
    description: "Resolves assigned tickets and PPM visits in the field.",
    grants: {
      "account.read": "own",
      "contract.read": "own",
      "ticket.read": "own",
      "ticket.update": "own",
      "asset.manage": "own",
      "inventory.read": "org",
    },
  },
  {
    key: "procurement_officer",
    name: "Procurement Officer",
    description: "Manages inventory, suppliers, and purchase orders.",
    grants: {
      "account.read": "org",
      "inventory.read": "org",
      "inventory.manage": "org",
      "po.create": "org",
      "po.approve": "org",
      "equipment.read": "org",
      "equipment.manage": "org",
      "quotation.cost.view": "org",
      "report.view": "org",
    },
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Read-only financial visibility, reporting, and audit.",
    grants: {
      ...orgWideRead,
      "audit.view": "org",
    },
  },
];

export const SYSTEM_ROLE_BY_KEY: Record<RoleKey, SystemRole> = Object.fromEntries(
  SYSTEM_ROLES.map((r) => [r.key, r]),
) as Record<RoleKey, SystemRole>;

/**
 * Merge a user's roles into an effective grant map, keeping the widest scope
 * for each permission. System roles are the source of truth for grants; the
 * `role_permissions` table mirrors them for display and future custom roles.
 */
export function resolveGrants(roleKeys: string[]): Map<PermissionKey, Scope> {
  const out = new Map<PermissionKey, Scope>();
  for (const rk of roleKeys) {
    const role = SYSTEM_ROLE_BY_KEY[rk as RoleKey];
    if (!role) continue;
    for (const [perm, scope] of Object.entries(role.grants) as [
      PermissionKey,
      Scope,
    ][]) {
      const existing = out.get(perm);
      if (!existing || SCOPE_RANK[scope] > SCOPE_RANK[existing]) {
        out.set(perm, scope);
      }
    }
  }
  return out;
}
