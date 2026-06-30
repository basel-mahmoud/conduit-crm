import { text, timestamp } from "drizzle-orm/pg-core";

/**
 * Audit timestamp columns applied to every business table.
 * `deletedAt` drives soft-delete; hard delete is reserved for PII erasure.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/** Who created / last touched a row (Clerk user id, nullable for system writes). */
export const actorColumns = {
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
};
