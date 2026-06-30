import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { users } from "./users";
import { timestamps } from "./_shared";

/** Roles are per-org so a tenant can extend the 11 system roles later. */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    key: text("key").notNull(), // e.g. 'sales_engineer'
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("roles_org_key_uq").on(t.orgId, t.key)],
);

/** Global catalog of `resource.action` permissions (org-independent). */
export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(), // 'lead.create'
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
});

/** Role → permission grant, qualified by record scope. */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionKey: text("permission_key")
      .references(() => permissions.key, { onDelete: "cascade" })
      .notNull(),
    scope: text("scope", { enum: ["own", "team", "branch", "org"] })
      .notNull()
      .default("org"),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

/** User → role assignment, optionally bound to a branch. */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    branchId: uuid("branch_id"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_roles_role_idx").on(t.roleId),
  ],
);

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
