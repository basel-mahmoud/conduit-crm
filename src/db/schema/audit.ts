import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

/**
 * Append-only, tamper-evident audit log.
 * Each row stores `prevHash` (last row's hash for the org) and `rowHash`
 * (hash of this row's canonical payload). A broken chain = tampering.
 * Writes happen inside the same transaction as the audited change.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigserial("seq", { mode: "number" }).notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(), // 'lead.create', 'quotation.approve', ...
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata"),
    prevHash: text("prev_hash"),
    rowHash: text("row_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("audit_org_seq_idx").on(t.orgId, t.seq),
    index("audit_resource_idx").on(t.resource, t.resourceId),
  ],
);

/** Human-facing activity timeline (distinct from the security audit log). */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    subjectType: text("subject_type").notNull(), // 'lead', 'opportunity', ...
    subjectId: text("subject_id").notNull(),
    type: text("type").notNull(), // 'note', 'stage_change', 'call', ...
    payload: jsonb("payload"),
    actorId: text("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("activity_subject_idx").on(t.subjectType, t.subjectId),
    index("activity_org_idx").on(t.orgId),
  ],
);

export type AuditEntry = typeof auditLog.$inferSelect;
