import { z } from "zod";

import { ACCOUNT_TYPES, RATINGS } from "./labels";

/** Empty form strings ("") become undefined; emails are validated when present. */
const optionalEmail = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().email().optional(),
);
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const accountInputSchema = z.object({
  name: z.string().min(2, "Name is too short").max(160),
  type: z.enum(ACCOUNT_TYPES),
  email: optionalEmail,
  phone: optionalText(40),
  industry: optionalText(120),
  website: optionalText(200),
  tradeLicense: optionalText(80),
  vatNo: optionalText(40),
  rating: z.enum(RATINGS).default("b"),
  status: z.enum(["active", "inactive"]).default("active"),
  addressLine: optionalText(200),
  city: optionalText(80),
  country: optionalText(80),
  notes: optionalText(2000),
});

export type AccountInput = z.infer<typeof accountInputSchema>;

export const contactInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: optionalText(80),
  title: optionalText(120),
  email: optionalEmail,
  phone: optionalText(40),
  mobile: optionalText(40),
  isPrimary: z.boolean().default(false),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
