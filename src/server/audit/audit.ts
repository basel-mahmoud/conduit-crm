/**
 * Tamper-evident audit log writer.
 *
 * Writes run inside the caller's transaction so the audit row commits
 * atomically with the change it records. A per-org transaction-scoped advisory
 * lock serialises writes for an org, preventing two concurrent transactions
 * from forking the hash chain.
 */
import { desc, eq, sql } from "drizzle-orm";

import type { Transaction } from "@/db";
import { auditLog } from "@/db/schema";
import { computeRowHash, type AuditPayload } from "./hash";

export type AuditInput = AuditPayload;

export async function writeAudit(
  tx: Transaction,
  input: AuditInput,
): Promise<string> {
  // Serialise audit writes for this org within the transaction.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.orgId}))`);

  const [prev] = await tx
    .select({ rowHash: auditLog.rowHash })
    .from(auditLog)
    .where(eq(auditLog.orgId, input.orgId))
    .orderBy(desc(auditLog.seq))
    .limit(1);

  const prevHash = prev?.rowHash ?? null;
  const rowHash = computeRowHash(input, prevHash);

  await tx.insert(auditLog).values({
    orgId: input.orgId,
    actorId: input.actorId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    metadata: input.metadata ?? null,
    prevHash,
    rowHash,
  });

  return rowHash;
}

/** Verify an org's audit chain (scheduled integrity check / admin tool). */
export async function verifyAuditChain(
  tx: Transaction,
  orgId: string,
): Promise<{ ok: boolean; brokenAtSeq?: number }> {
  const rows = await tx
    .select()
    .from(auditLog)
    .where(eq(auditLog.orgId, orgId))
    .orderBy(auditLog.seq);

  let prevHash: string | null = null;
  for (const r of rows) {
    const expected: string = computeRowHash(
      {
        orgId: r.orgId,
        actorId: r.actorId,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId,
        before: r.before,
        after: r.after,
        metadata: (r.metadata as Record<string, unknown> | null) ?? null,
      },
      prevHash,
    );
    if (expected !== r.rowHash || r.prevHash !== prevHash) {
      return { ok: false, brokenAtSeq: r.seq };
    }
    prevHash = r.rowHash;
  }
  return { ok: true };
}
