import { z } from "zod";

import { PROJECT_TYPES } from "../shared/project-types";

export const lineInputSchema = z.object({
  sectionTitle: z.string().max(120).default("General"),
  description: z.string().min(1, "Description required").max(400),
  qty: z.coerce.number().nonnegative().default(1),
  unit: z.string().max(20).default("nos"),
  materialUnitCost: z.coerce.number().nonnegative().default(0),
  laborUnitCost: z.coerce.number().nonnegative().default(0),
  engineeringUnitCost: z.coerce.number().nonnegative().default(0),
  subcontractorUnitCost: z.coerce.number().nonnegative().default(0),
  markupPct: z.coerce.number().default(0),
});

export type LineInput = z.infer<typeof lineInputSchema>;

export const saveRevisionSchema = z.object({
  lines: z.array(lineInputSchema),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  validUntil: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  notes: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().max(2000).optional(),
  ),
});

export type SaveRevisionInput = z.infer<typeof saveRevisionSchema>;

export const newQuotationSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  accountId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().uuid().optional(),
  ),
  projectType: z.enum(PROJECT_TYPES).default("bms"),
});

export type NewQuotationInput = z.infer<typeof newQuotationSchema>;
