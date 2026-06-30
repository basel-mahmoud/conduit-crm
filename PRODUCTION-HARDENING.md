# Conduit — Production Hardening

Standing production-readiness standard, tracked per item. Legend:
✅ implemented · 🟡 partial / scaffolded · ⏳ planned (milestone) · 🏗 platform-provided.

> Definition of "done" for every feature includes the relevant rows below.

## Security
| Item | Status | Notes |
|---|---|---|
| Input sanitization & injection prevention | 🟡 | Zod at boundaries; Drizzle parameterized queries (no raw SQL in app). Full coverage as endpoints land. |
| Authentication | ⏳ M2 | Clerk. |
| Authorization · roles & permissions (least privilege) | ⏳ M2 | RBAC tables built; guard + matrix in M2. |
| Session management & token expiry | ⏳ M2 | Clerk sessions. |
| Secrets management | ✅ | `.env*` gitignored; `.env.example` template only; Vercel env at deploy. |
| HTTPS / TLS / encryption in transit | 🏗 | Vercel TLS; Neon `sslmode=require`. |
| Encryption at rest | 🏗 | Neon-managed. |
| Rate limiting & abuse prevention | ⏳ M2/M11 | Upstash on auth/AI/export/upload. |
| Dependency scanning & patching | 🟡 | `npm audit` reviewed; CI gate + Dependabot in M11. |
| Multi-tenancy & data isolation | 🟡 | `org_id` on every table; repo scoping + RLS in M2. |
| PII handling · retention · deletion | ⏳ M11 | Policy + erasure workflow. |
| Audit trails & tamper-evident logging | 🟡 | Hash-chain columns in `audit_log`; in-transaction writes in M2. |
| Security headers (CSP/HSTS/X-Frame-Options) | ⏳ M2 | Set in `next.config` / proxy. |

## Testing & CI
| Item | Status | Notes |
|---|---|---|
| Unit / integration / e2e / regression | ⏳ M2+ | Vitest + Playwright; first suites with RBAC. |
| Load & stress · chaos/resilience | ⏳ M11 | k6 + failure-mode tests. |
| CI enforcement (block merge on fail) | ⏳ M2 | GitHub Actions: lint, typecheck, test, audit. |
| Code review standards (lint/typecheck/conventions) | ✅ | ESLint flat + strict TS; green. |

## Reliability & resilience
| Item | Status | Notes |
|---|---|---|
| Error handling & graceful degradation | 🟡 | Env fails fast; error boundaries per route in M2+. |
| Retry + backoff **and** idempotency | ⏳ M2 | Idempotency keys on mutating endpoints; atomic `number_sequences`. |
| Circuit breakers & fallback | ⏳ M10/M11 | Around AI/email/external. |
| Concurrency & race-condition prevention | 🟡 | `SELECT … FOR UPDATE` pattern for sequences; optimistic concurrency on quotes. |
| Caching strategy & invalidation | ⏳ M9 | TanStack Query + tag-based revalidation. |
| RTO/RPO · DR · backups | 🏗/⏳ M11 | Neon PITR; documented DR runbook in M11. |

## Architecture & docs
| Item | Status | Notes |
|---|---|---|
| Accessibility (WCAG) | 🟡 | Radix primitives, focus rings, reduced-motion; axe pass in M11. |
| ADRs | 🟡 | `docs/adr/0001` (stack); more per milestone. |
| Architecture diagrams | 🟡 | Overview in plan; ERD as schema grows. |
| API contracts | ⏳ M2 | Typed contracts under `docs/api-contracts/`. |
