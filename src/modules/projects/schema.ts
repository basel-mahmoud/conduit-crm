import { z } from "zod";

import { PROJECT_TYPES } from "../shared/project-types";
import {
  HEALTHS,
  PHASE_STATUSES,
  PROJECT_STATUSES,
  SNAG_SEVERITIES,
  SNAG_STATUSES,
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

export const projectInputSchema = z.object({
  name: z.string().min(2, "Name is too short").max(200),
  projectType: z.enum(PROJECT_TYPES).default("bms"),
  accountId: optUuid,
  contractValue: optNum,
  status: z.enum(PROJECT_STATUSES).default("registered"),
  health: z.enum(HEALTHS).default("on_track"),
  pmId: optText(120),
  siteEngineerId: optText(120),
  location: optText(160),
  startDate: optDate,
  targetEndDate: optDate,
  notes: optText(2000),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const phasesInputSchema = z.object({
  phases: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(PHASE_STATUSES),
      progressPct: z.coerce.number().int().min(0).max(100),
    }),
  ),
});
export type PhasesInput = z.infer<typeof phasesInputSchema>;

export const milestoneInputSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  dueDate: optDate,
});
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;

export const snagInputSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  description: optText(1000),
  severity: z.enum(SNAG_SEVERITIES).default("medium"),
  dueDate: optDate,
});
export type SnagInput = z.infer<typeof snagInputSchema>;

export const snagStatusSchema = z.enum(SNAG_STATUSES);
