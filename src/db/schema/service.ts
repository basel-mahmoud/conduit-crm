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
import { projects } from "./projects";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const contractType = pgEnum("contract_type", ["amc", "ppm"]);
export const contractStatus = pgEnum("contract_status", [
  "draft",
  "active",
  "expiring",
  "expired",
  "renewed",
  "cancelled",
]);
export const ppmFrequency = pgEnum("ppm_frequency", [
  "monthly",
  "quarterly",
  "biannual",
  "annual",
]);
export const assetCategory = pgEnum("asset_category", [
  "controller",
  "ddc",
  "sensor",
  "actuator",
  "valve",
  "thermostat",
  "vfd",
  "btu_meter",
  "lighting_ctrl",
  "hvac",
  "other",
]);
export const assetStatus = pgEnum("asset_status", [
  "active",
  "faulty",
  "decommissioned",
]);
export const visitStatus = pgEnum("visit_status", [
  "planned",
  "completed",
  "missed",
  "rescheduled",
]);
export const ticketType = pgEnum("ticket_type", [
  "breakdown",
  "request",
  "ppm",
]);
export const ticketPriority = pgEnum("ticket_priority", [
  "p1",
  "p2",
  "p3",
  "p4",
]);
export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
]);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    number: text("number").notNull(),
    type: contractType("type").notNull().default("amc"),
    title: text("title").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    value: numeric("value", { precision: 16, scale: 2 }),
    annualCost: numeric("annual_cost", { precision: 16, scale: 2 }),
    status: contractStatus("status").notNull().default("active"),
    ppmFrequency: ppmFrequency("ppm_frequency"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    renewalReminderAt: date("renewal_reminder_at"),
    ownerId: text("owner_id"),
    notes: text("notes"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("contracts_org_idx").on(t.orgId),
    index("contracts_org_status_idx").on(t.orgId, t.status),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    contractId: uuid("contract_id").references(() => contracts.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    category: assetCategory("category").notNull().default("controller"),
    manufacturer: text("manufacturer"),
    model: text("model"),
    serialNo: text("serial_no"),
    location: text("location"),
    installDate: date("install_date"),
    warrantyEnd: date("warranty_end"),
    status: assetStatus("status").notNull().default("active"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("assets_org_idx").on(t.orgId),
    index("assets_contract_idx").on(t.contractId),
  ],
);

export const ppmVisits = pgTable(
  "ppm_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    contractId: uuid("contract_id")
      .references(() => contracts.id, { onDelete: "cascade" })
      .notNull(),
    scheduledDate: date("scheduled_date").notNull(),
    status: visitStatus("status").notNull().default("planned"),
    technicianId: text("technician_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    findings: text("findings"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("visits_contract_idx").on(t.contractId)],
);

export const serviceTickets = pgTable(
  "service_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    number: text("number").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    contractId: uuid("contract_id").references(() => contracts.id, {
      onDelete: "set null",
    }),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    type: ticketType("type").notNull().default("breakdown"),
    priority: ticketPriority("priority").notNull().default("p3"),
    status: ticketStatus("status").notNull().default("open"),
    slaResponseMins: integer("sla_response_mins").notNull().default(480),
    slaResolveMins: integer("sla_resolve_mins").notNull().default(2880),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    assignedTo: text("assigned_to"),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolution: text("resolution"),
    csat: integer("csat"),
    ownerId: text("owner_id"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("tickets_org_idx").on(t.orgId),
    index("tickets_org_status_idx").on(t.orgId, t.status),
    index("tickets_sla_idx").on(t.slaDueAt),
  ],
);

export type Contract = typeof contracts.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type PpmVisit = typeof ppmVisits.$inferSelect;
export type ServiceTicket = typeof serviceTickets.$inferSelect;
