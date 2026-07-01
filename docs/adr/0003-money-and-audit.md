# ADR-0003 — Exact money math & tamper-evident audit

- **Status:** Accepted
- **Date:** 2026-06-30

## Context
Quotations drive commercial decisions, so rounding drift is unacceptable. Audit
trails must be trustworthy for a contracting business (approvals, discounts,
status changes).

## Decision
1. **Money** is computed in **integer cents** (`src/modules/quotations/calc.ts`)
   and stored as `NUMERIC`. No floating-point arithmetic crosses a money boundary;
   line and total figures are rounded deterministically at the cent. Golden tests
   lock the arithmetic (`tests/calc.test.ts`).
2. **Audit** is an append-only, **hash-chained** log
   (`src/server/audit/*`): each entry stores `prevHash` and a `sha256` `rowHash`
   over its canonical payload incl. the previous hash. Writes happen inside the
   caller's transaction, serialized per-org with a Postgres advisory lock, so the
   audit row commits atomically with the change and the chain cannot fork. A
   `verifyAuditChain` routine (and unit tests) detect tampering or reordering.

## Consequences
- Quotation/PO/contract totals are exact and reproducible.
- Any post-hoc mutation of an audit row breaks the chain and is detectable.
- Slightly more write cost per audited mutation (one advisory lock + one hash) —
  acceptable for the integrity guarantee.
