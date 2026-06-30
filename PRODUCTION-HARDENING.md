# Conduit — Production Hardening

Standing production-readiness standard, tracked per item. Legend:
✅ implemented · 🟡 partial / scaffolded · ⏳ planned (milestone) · 🏗 platform-provided.

> Definition of "done" for every feature includes the relevant rows below.

## Security
| Item | Status | Notes |
|---|---|---|
| Input sanitization & injection prevention | ✅ | Zod at every action boundary; Drizzle parameterized queries (no raw SQL); soft-delete. |
| Authentication | 🟡 | Clerk wired & gated; dev-auth fallback active until keys provisioned. |
| Authorization · roles & permissions (least privilege) | ✅ | 48-perm catalog, 11 roles, scoped guard + field-level cost gate; unit-tested. |
| Session management & token expiry | ⏳ M2 | Clerk sessions. |
| Secrets management | ✅ | `.env*` gitignored; `.env.example` template only; Vercel env at deploy. |
| HTTPS / TLS / encryption in transit | 🏗 | Vercel TLS; Neon `sslmode=require`. |
| Encryption at rest | 🏗 | Neon-managed. |
| Rate limiting & abuse prevention | ⏳ M2/M11 | Upstash on auth/AI/export/upload. |
| Dependency scanning & patching | 🟡 | `npm audit` reviewed; CI gate + Dependabot in M11. |
| Multi-tenancy & data isolation | 🟡 | `org_id` on every table; service queries enforce org scope (verified); Postgres RLS deferred to M11. |
| PII handling · retention · deletion | ⏳ M11 | Policy + erasure workflow. |
| Audit trails & tamper-evident logging | ✅ | sha256 hash chain, per-org advisory lock, in-transaction writer + verifier; unit-tested. |
| Security headers (CSP/HSTS/X-Frame-Options) | ⏳ M2 | Set in `next.config` / proxy. |

## Testing & CI
| Item | Status | Notes |
|---|---|---|
| Unit / integration / e2e / regression | 🟡 | 15 Vitest unit tests (RBAC + audit); integration/e2e with the data layer (M3+). |
| Load & stress · chaos/resilience | ⏳ M11 | k6 + failure-mode tests. |
| CI enforcement (block merge on fail) | ✅ | GitHub Actions: lint, typecheck, test, build on push/PR. |
| Code review standards (lint/typecheck/conventions) | ✅ | ESLint flat + strict TS; green. |

## Reliability & resilience
| Item | Status | Notes |
|---|---|---|
| Error handling & graceful degradation | 🟡 | Env fails fast; error boundaries per route in M2+. |
| Retry + backoff **and** idempotency | ⏳ M2 | Idempotency keys on mutating endpoints; atomic `number_sequences`. |
| Circuit breakers & fallback | ⏳ M10/M11 | Around AI/email/external. |
| Concurrency & race-condition prevention | ✅ | `SELECT … FOR UPDATE` number allocation + per-org advisory-locked audit; optimistic concurrency on quotes (M5). |
| Caching strategy & invalidation | ⏳ M9 | TanStack Query + tag-based revalidation. |
| RTO/RPO · DR · backups | 🏗/⏳ M11 | Neon PITR; documented DR runbook in M11. |

## Architecture & docs
| Item | Status | Notes |
|---|---|---|
| Accessibility (WCAG) | 🟡 | Radix primitives, focus rings, reduced-motion; axe pass in M11. |
| ADRs | 🟡 | `docs/adr/0001` (stack); more per milestone. |
| Architecture diagrams | 🟡 | Overview in plan; ERD as schema grows. |
| API contracts | ⏳ M2 | Typed contracts under `docs/api-contracts/`. |
