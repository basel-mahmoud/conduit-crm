import {
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

/** The eight account types a systems integrator deals with. */
export const accountType = pgEnum("account_type", [
  "end_user",
  "consultant",
  "contractor",
  "developer",
  "fm", // facility management company
  "mep", // MEP contractor
  "supplier",
  "brand_partner",
]);

export const accountRating = pgEnum("account_rating", ["a", "b", "c"]);
export const accountStatus = pgEnum("account_status", ["active", "inactive"]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    type: accountType("type").notNull(),
    name: text("name").notNull(),
    tradeLicense: text("trade_license"),
    vatNo: text("vat_no"),
    industry: text("industry"),
    website: text("website"),
    email: text("email"),
    phone: text("phone"),
    rating: accountRating("rating").notNull().default("b"),
    status: accountStatus("status").notNull().default("active"),
    addressLine: text("address_line"),
    city: text("city"),
    country: text("country").default("United Arab Emirates"),
    notes: text("notes"),
    ownerId: text("owner_id"), // users.id (no FK: owner may be deactivated)
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("accounts_org_idx").on(t.orgId),
    index("accounts_org_type_idx").on(t.orgId, t.type),
    index("accounts_owner_idx").on(t.ownerId),
  ],
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
