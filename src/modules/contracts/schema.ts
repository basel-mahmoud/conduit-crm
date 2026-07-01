import { z } from "zod";

import {
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  PPM_FREQUENCIES,
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
const optDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);
const optFreq = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.enum(PPM_FREQUENCIES).optional(),
);

export const contractInputSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  type: z.enum(CONTRACT_TYPES).default("amc"),
  accountId: optUuid,
  value: optNum,
  annualCost: optNum,
  status: z.enum(CONTRACT_STATUSES).default("active"),
  ppmFrequency: optFreq,
  startDate: optDate,
  endDate: optDate,
  renewalReminderAt: optDate,
  notes: optText(2000),
});
export type ContractInput = z.infer<typeof contractInputSchema>;

export const assetInputSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  category: z.enum(ASSET_CATEGORIES).default("controller"),
  manufacturer: optText(120),
  model: optText(120),
  serialNo: optText(120),
  location: optText(160),
  installDate: optDate,
  warrantyEnd: optDate,
  status: z.enum(ASSET_STATUSES).default("active"),
});
export type AssetInput = z.infer<typeof assetInputSchema>;

export const visitInputSchema = z.object({
  scheduledDate: z.string().min(1, "Date required"),
});
export type VisitInput = z.infer<typeof visitInputSchema>;
