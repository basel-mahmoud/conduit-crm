import {
  boolean,
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
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const quotationStatus = pgEnum("quotation_status", [
  "draft",
  "in_review",
  "approved",
  "sent",
  "won",
  "lost",
  "expired",
]);

export const revisionStatus = pgEnum("revision_status", [
  "draft",
  "in_review",
  "approved",
  "sent",
  "superseded",
]);

export const discountApprovalStatus = pgEnum("discount_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    projectType: projectType("project_type").notNull().default("bms"),
    status: quotationStatus("status").notNull().default("draft"),
    currentRevisionId: uuid("current_revision_id"),
    currency: text("currency").notNull().default("AED"),
    ownerId: text("owner_id"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("quotations_org_idx").on(t.orgId),
    index("quotations_opp_idx").on(t.opportunityId),
  ],
);

/** A revision is an immutable snapshot once superseded. Totals are cached here. */
export const quotationRevisions = pgTable(
  "quotation_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    quotationId: uuid("quotation_id")
      .references(() => quotations.id, { onDelete: "cascade" })
      .notNull(),
    revNo: integer("rev_no").notNull().default(0),
    status: revisionStatus("status").notNull().default("draft"),
    validUntil: date("valid_until"),
    notes: text("notes"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0500"),
    discountPct: numeric("discount_pct", { precision: 6, scale: 3 })
      .notNull()
      .default("0"),
    discountApproved: boolean("discount_approved").notNull().default(true),
    discountApprovedBy: text("discount_approved_by"),
    // Cached totals (recomputed on every save from the lines).
    materialCost: numeric("material_cost", { precision: 16, scale: 2 }).notNull().default("0"),
    laborCost: numeric("labor_cost", { precision: 16, scale: 2 }).notNull().default("0"),
    engineeringCost: numeric("engineering_cost", { precision: 16, scale: 2 }).notNull().default("0"),
    subcontractorCost: numeric("subcontractor_cost", { precision: 16, scale: 2 }).notNull().default("0"),
    totalCost: numeric("total_cost", { precision: 16, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 16, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 16, scale: 2 }).notNull().default("0"),
    netSubtotal: numeric("net_subtotal", { precision: 16, scale: 2 }).notNull().default("0"),
    vatAmount: numeric("vat_amount", { precision: 16, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("grand_total", { precision: 16, scale: 2 }).notNull().default("0"),
    marginAmount: numeric("margin_amount", { precision: 16, scale: 2 }).notNull().default("0"),
    marginPct: numeric("margin_pct", { precision: 6, scale: 2 }).notNull().default("0"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("qrev_quotation_idx").on(t.quotationId)],
);

export const quotationLines = pgTable(
  "quotation_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    revisionId: uuid("revision_id")
      .references(() => quotationRevisions.id, { onDelete: "cascade" })
      .notNull(),
    sectionTitle: text("section_title").notNull().default("General"),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description").notNull(),
    qty: numeric("qty", { precision: 14, scale: 3 }).notNull().default("1"),
    unit: text("unit").notNull().default("nos"),
    materialUnitCost: numeric("material_unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    laborUnitCost: numeric("labor_unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    engineeringUnitCost: numeric("engineering_unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    subcontractorUnitCost: numeric("subcontractor_unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    markupPct: numeric("markup_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    lineTotal: numeric("line_total", { precision: 16, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("qline_revision_idx").on(t.revisionId)],
);

export const discountApprovals = pgTable(
  "discount_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    quotationId: uuid("quotation_id")
      .references(() => quotations.id, { onDelete: "cascade" })
      .notNull(),
    revisionId: uuid("revision_id")
      .references(() => quotationRevisions.id, { onDelete: "cascade" })
      .notNull(),
    requestedPct: numeric("requested_pct", { precision: 6, scale: 3 }).notNull(),
    requestedBy: text("requested_by"),
    status: discountApprovalStatus("status").notNull().default("pending"),
    approverId: text("approver_id"),
    reason: text("reason"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("dappr_quotation_idx").on(t.quotationId)],
);

export type Quotation = typeof quotations.$inferSelect;
export type QuotationRevision = typeof quotationRevisions.$inferSelect;
export type QuotationLine = typeof quotationLines.$inferSelect;
export type DiscountApproval = typeof discountApprovals.$inferSelect;
