import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const productCategory = pgEnum("product_category", [
  "controller",
  "ddc",
  "sensor",
  "actuator",
  "valve",
  "thermostat",
  "vfd",
  "btu_meter",
  "lighting_ctrl",
  "home_auto",
  "panel",
  "cable",
  "accessory",
  "other",
]);
export const productStatus = pgEnum("product_status", [
  "active",
  "discontinued",
]);
export const movementReason = pgEnum("movement_reason", [
  "purchase",
  "sale",
  "adjustment",
  "consumption",
  "return",
]);
export const poStatus = pgEnum("po_status", [
  "draft",
  "ordered",
  "received",
  "cancelled",
]);

export const manufacturers = pgTable(
  "manufacturers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    website: text("website"),
    ...timestamps,
  },
  (t) => [uniqueIndex("manufacturers_org_name_uq").on(t.orgId, t.name)],
);

/** Unified product / technical-equipment record (commercial + technical identity). */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    category: productCategory("category").notNull().default("controller"),
    manufacturerId: uuid("manufacturer_id").references(() => manufacturers.id, {
      onDelete: "set null",
    }),
    modelNo: text("model_no"),
    unit: text("unit").notNull().default("nos"),
    cost: numeric("cost", { precision: 14, scale: 2 }),
    sellPrice: numeric("sell_price", { precision: 14, scale: 2 }),
    leadTimeDays: integer("lead_time_days"),
    reorderLevel: integer("reorder_level").notNull().default(0),
    stockQty: integer("stock_qty").notNull().default(0),
    datasheetUrl: text("datasheet_url"),
    specs: jsonb("specs").$type<Record<string, string>>(),
    status: productStatus("status").notNull().default("active"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("products_org_idx").on(t.orgId),
    index("products_org_cat_idx").on(t.orgId, t.category),
    uniqueIndex("products_org_sku_uq").on(t.orgId, t.sku),
  ],
);

/** Append-only stock ledger — on-hand is also cached on products.stockQty. */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    qtyDelta: integer("qty_delta").notNull(),
    reason: movementReason("reason").notNull().default("adjustment"),
    note: text("note"),
    refType: text("ref_type"),
    refId: uuid("ref_id"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("movements_product_idx").on(t.productId)],
);

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    number: text("number").notNull(),
    supplierId: uuid("supplier_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    status: poStatus("status").notNull().default("draft"),
    orderDate: date("order_date"),
    expectedDate: date("expected_date"),
    total: numeric("total", { precision: 16, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    ownerId: text("owner_id"),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("po_org_idx").on(t.orgId),
    index("po_org_status_idx").on(t.orgId, t.status),
  ],
);

export const purchaseOrderLines = pgTable(
  "purchase_order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    poId: uuid("po_id")
      .references(() => purchaseOrders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    qty: integer("qty").notNull().default(1),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: numeric("line_total", { precision: 16, scale: 2 })
      .notNull()
      .default("0"),
    received: boolean("received").notNull().default(false),
  },
  (t) => [index("po_lines_po_idx").on(t.poId)],
);

export type Manufacturer = typeof manufacturers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;
