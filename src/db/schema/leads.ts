import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

/** Shared across leads, opportunities, quotations, projects. */
export const projectType = pgEnum("project_type", [
  "bms",
  "lcs",
  "home_automation",
  "ems",
  "btu",
  "hvac_controls",
  "elv",
  "other",
]);

export const leadSource = pgEnum("lead_source", [
  "referral",
  "website",
  "existing_client",
  "consultant",
  "tender",
  "cold_outreach",
  "other",
]);

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    refNo: text("ref_no").notNull(),
    source: leadSource("source").notNull().default("other"),
    status: leadStatus("status").notNull().default("new"),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    consultantId: uuid("consultant_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    contractorId: uuid("contractor_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    projectName: text("project_name").notNull(),
    projectLocation: text("project_location"),
    projectType: projectType("project_type").notNull().default("bms"),
    estValue: numeric("est_value", { precision: 14, scale: 2 }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    convertedOpportunityId: uuid("converted_opportunity_id"),
    ownerId: text("owner_id"),
    notes: text("notes"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("leads_org_idx").on(t.orgId),
    index("leads_org_status_idx").on(t.orgId, t.status),
    index("leads_followup_idx").on(t.nextFollowUpAt),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
