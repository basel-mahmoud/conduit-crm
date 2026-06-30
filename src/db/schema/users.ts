import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { timestamps } from "./_shared";

export const userStatus = pgEnum("user_status", [
  "invited",
  "active",
  "suspended",
  "deactivated",
]);

/**
 * Mirror of Clerk users, kept in sync via Clerk webhooks (M2).
 * `id` is the Clerk user id (text), so FKs elsewhere reference identity directly.
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user id
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    avatarUrl: text("avatar_url"),
    status: userStatus("status").notNull().default("invited"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("users_org_idx").on(t.orgId),
    index("users_email_idx").on(t.email),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
