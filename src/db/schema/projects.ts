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
import { opportunities } from "./opportunities";
import { projectType } from "./leads";
import { quotations } from "./quotations";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const projectStatus = pgEnum("project_status", [
  "registered",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
]);
export const projectHealth = pgEnum("project_health", [
  "on_track",
  "at_risk",
  "delayed",
]);
export const phaseKind = pgEnum("phase_kind", [
  "procurement",
  "engineering",
  "installation",
  "testing_commissioning",
  "handover",
]);
export const phaseStatus = pgEnum("phase_status", [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
]);
export const milestoneStatus = pgEnum("milestone_status", ["pending", "done"]);
export const snagSeverity = pgEnum("snag_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const snagStatus = pgEnum("snag_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    quotationId: uuid("quotation_id").references(() => quotations.id, {
      onDelete: "set null",
    }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    projectType: projectType("project_type").notNull().default("bms"),
    contractValue: numeric("contract_value", { precision: 16, scale: 2 }),
    status: projectStatus("status").notNull().default("registered"),
    health: projectHealth("health").notNull().default("on_track"),
    pmId: text("pm_id"),
    siteEngineerId: text("site_engineer_id"),
    location: text("location"),
    startDate: date("start_date"),
    targetEndDate: date("target_end_date"),
    actualEndDate: date("actual_end_date"),
    ownerId: text("owner_id"),
    notes: text("notes"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("projects_org_idx").on(t.orgId),
    index("projects_org_status_idx").on(t.orgId, t.status),
  ],
);

export const projectPhases = pgTable(
  "project_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    kind: phaseKind("kind").notNull(),
    status: phaseStatus("status").notNull().default("not_started"),
    progressPct: integer("progress_pct").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("phases_project_idx").on(t.projectId)],
);

export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    dueDate: date("due_date"),
    status: milestoneStatus("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("milestones_project_idx").on(t.projectId)],
);

export const snags = pgTable(
  "snags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    severity: snagSeverity("severity").notNull().default("medium"),
    status: snagStatus("status").notNull().default("open"),
    assignedTo: text("assigned_to"),
    raisedBy: text("raised_by"),
    dueDate: date("due_date"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [index("snags_project_idx").on(t.projectId)],
);

export type Project = typeof projects.$inferSelect;
export type ProjectPhase = typeof projectPhases.$inferSelect;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type Snag = typeof snags.$inferSelect;
