import {
  jsonb,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";

/**
 * Tenant root. The product runs single-company today but every business row
 * carries `org_id`, so multi-tenant is a config flip, not a rewrite.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkOrgId: text("clerk_org_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    currency: text("currency").notNull().default("AED"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0500"),
    fiscalYearStart: text("fiscal_year_start").notNull().default("01-01"),
    settings: jsonb("settings")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex("organizations_slug_uq").on(t.slug)],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
