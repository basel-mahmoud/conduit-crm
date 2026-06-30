import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { leads, projectType } from "./leads";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const oppStage = pgEnum("opp_stage", [
  "new",
  "qualified",
  "budgetary",
  "technical",
  "commercial",
  "negotiation",
  "awaiting_po",
  "won",
  "lost",
]);

export const approvalStatus = pgEnum("approval_status", [
  "na",
  "pending",
  "approved",
  "rejected",
]);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    refNo: text("ref_no").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    stage: oppStage("stage").notNull().default("new"),
    probability: integer("probability").notNull().default(10),
    value: numeric("value", { precision: 14, scale: 2 }),
    projectType: projectType("project_type").notNull().default("bms"),
    expectedCloseDate: date("expected_close_date"),
    consultantApproval: approvalStatus("consultant_approval")
      .notNull()
      .default("na"),
    contractorApproval: approvalStatus("contractor_approval")
      .notNull()
      .default("na"),
    competitor: text("competitor"),
    lostReason: text("lost_reason"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ownerId: text("owner_id"),
    notes: text("notes"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("opps_org_idx").on(t.orgId),
    index("opps_org_stage_idx").on(t.orgId, t.stage),
    index("opps_account_idx").on(t.accountId),
  ],
);

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
