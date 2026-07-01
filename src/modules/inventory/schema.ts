import { z } from "zod";

import {
  MOVEMENT_REASONS,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
} from "./labels";

const optText = (max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().max(max).optional());
const optUuid = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().uuid().optional(),
);
const optNum = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().nonnegative().optional(),
);
const optInt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().int().nonnegative().optional(),
);
const optDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

export const productInputSchema = z.object({
  sku: z.string().min(1, "SKU required").max(60),
  name: z.string().min(2, "Name is too short").max(200),
  category: z.enum(PRODUCT_CATEGORIES).default("controller"),
  manufacturerName: optText(120),
  modelNo: optText(120),
  unit: z.string().max(20).default("nos"),
  cost: optNum,
  sellPrice: optNum,
  leadTimeDays: optInt,
  reorderLevel: z.coerce.number().int().nonnegative().default(0),
  datasheetUrl: optText(400),
  status: z.enum(PRODUCT_STATUSES).default("active"),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const adjustStockSchema = z.object({
  qtyDelta: z.coerce.number().int().refine((n) => n !== 0, "Enter a non-zero quantity"),
  reason: z.enum(MOVEMENT_REASONS).default("adjustment"),
  note: optText(300),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const poInputSchema = z.object({
  supplierId: optUuid,
  orderDate: optDate,
  expectedDate: optDate,
  notes: optText(1000),
});
export type PoInput = z.infer<typeof poInputSchema>;

export const poLineInputSchema = z.object({
  productId: optUuid,
  description: z.string().min(1, "Description required").max(300),
  qty: z.coerce.number().int().positive().default(1),
  unitCost: z.coerce.number().nonnegative().default(0),
});
export type PoLineInput = z.infer<typeof poLineInputSchema>;
