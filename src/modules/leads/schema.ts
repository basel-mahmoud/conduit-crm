import { z } from "zod";

import { PROJECT_TYPES } from "../shared/project-types";
import { LEAD_SOURCES, LEAD_STATUSES } from "./labels";

const optText = (max: number) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().max(max).optional(),
  );
const optUuid = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().uuid().optional(),
);
const optNum = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().nonnegative().optional(),
);
const optDateTime = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

export const leadInputSchema = z.object({
  projectName: z.string().min(2, "Project name is too short").max(160),
  source: z.enum(LEAD_SOURCES).default("other"),
  status: z.enum(LEAD_STATUSES).default("new"),
  projectType: z.enum(PROJECT_TYPES).default("bms"),
  projectLocation: optText(160),
  estValue: optNum,
  accountId: optUuid,
  consultantId: optUuid,
  contractorId: optUuid,
  nextFollowUpAt: optDateTime,
  notes: optText(2000),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
