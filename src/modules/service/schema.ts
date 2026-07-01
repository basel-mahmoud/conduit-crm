import { z } from "zod";

import { TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from "./labels";

const optText = (max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().max(max).optional());
const optUuid = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().uuid().optional(),
);

export const ticketInputSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  description: optText(2000),
  type: z.enum(TICKET_TYPES).default("breakdown"),
  priority: z.enum(TICKET_PRIORITIES).default("p3"),
  accountId: optUuid,
  contractId: optUuid,
});
export type TicketInput = z.infer<typeof ticketInputSchema>;

export const resolveInputSchema = z.object({
  resolution: z.string().min(2, "Add a resolution note").max(2000),
  csat: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(5).optional(),
  ),
});
export type ResolveInput = z.infer<typeof resolveInputSchema>;

export const ticketStatusSchema = z.enum(TICKET_STATUSES);
