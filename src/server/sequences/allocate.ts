/**
 * Atomic document-number allocation (quotation / project / PO / ticket / …).
 * `SELECT … FOR UPDATE` locks the sequence row so concurrent requests never
 * collide or skip. Call inside the same transaction as the entity insert so the
 * number is only consumed if the record commits (idempotent on retry).
 */
import { and, eq } from "drizzle-orm";

import type { Transaction } from "@/db";
import { numberSequences } from "@/db/schema";

export interface AllocatedNumber {
  value: number;
  formatted: string;
}

export async function allocateNumber(
  tx: Transaction,
  orgId: string,
  kind: string,
): Promise<AllocatedNumber> {
  const [row] = await tx
    .select()
    .from(numberSequences)
    .where(and(eq(numberSequences.orgId, orgId), eq(numberSequences.kind, kind)))
    .limit(1)
    .for("update");

  if (!row) {
    throw new Error(`No number sequence configured for kind "${kind}"`);
  }

  const value = row.nextVal;
  await tx
    .update(numberSequences)
    .set({ nextVal: value + 1 })
    .where(eq(numberSequences.id, row.id));

  const formatted = `${row.prefix}${String(value).padStart(row.padding, "0")}`;
  return { value, formatted };
}
