import { z } from "zod";

import { PROJECT_TYPES } from "../shared/project-types";
import { APPROVALS, OPP_STAGES } from "./labels";

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
const optDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

export const opportunityInputSchema = z.object({
  name: z.string().min(2, "Name is too short").max(160),
  stage: z.enum(OPP_STAGES).default("new"),
  probability: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(100).optional(),
  ),
  value: optNum,
  projectType: z.enum(PROJECT_TYPES).default("bms"),
  accountId: optUuid,
  expectedCloseDate: optDate,
  consultantApproval: z.enum(APPROVALS).default("na"),
  contractorApproval: z.enum(APPROVALS).default("na"),
  competitor: optText(160),
  notes: optText(2000),
});

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;

export const STAGE_VALUES = OPP_STAGES;
