/**
 * Pure audit-hashing primitives (no DB import) so the chain logic is unit
 * testable in isolation. `computeRowHash` = sha256 over the canonical payload
 * including the previous row's hash → any mutation or reordering breaks the chain.
 */
import { createHash } from "node:crypto";

export interface AuditPayload {
  orgId: string;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | null;
}

export function canonicalize(p: AuditPayload, prevHash: string | null): string {
  return JSON.stringify({
    orgId: p.orgId,
    actorId: p.actorId ?? null,
    action: p.action,
    resource: p.resource,
    resourceId: p.resourceId ?? null,
    before: p.before ?? null,
    after: p.after ?? null,
    metadata: p.metadata ?? null,
    prevHash,
  });
}

export function computeRowHash(
  p: AuditPayload,
  prevHash: string | null,
): string {
  return createHash("sha256").update(canonicalize(p, prevHash)).digest("hex");
}
