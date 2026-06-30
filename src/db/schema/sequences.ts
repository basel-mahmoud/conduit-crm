import {
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

/**
 * Per-org, per-kind document number allocation (quotation / project / PO /
 * ticket / lead / opportunity). Incremented atomically (SELECT … FOR UPDATE)
 * so concurrent requests never collide or skip — no app-side counting.
 */
export const numberSequences = pgTable(
  "number_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull(), // 'quotation' | 'project' | 'po' | 'ticket' | ...
    prefix: text("prefix").notNull().default(""),
    padding: integer("padding").notNull().default(5),
    nextVal: integer("next_val").notNull().default(1),
  },
  (t) => [uniqueIndex("number_sequences_org_kind_uq").on(t.orgId, t.kind)],
);

export type NumberSequence = typeof numberSequences.$inferSelect;
