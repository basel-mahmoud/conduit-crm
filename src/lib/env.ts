/**
 * Server-side environment validation.
 * Import only from server code (DB, route handlers, server actions).
 * Validated once at module load so misconfiguration fails fast and loud.
 */
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables — see logs above.");
}

export const env = parsed.data;
