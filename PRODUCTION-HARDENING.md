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
| Rate limiting & abuse prevention | 🟡 | Fixed-window limiter on AI endpoints (`src/server/rate-limit.ts`); Upstash for distributed/all-mutations. |
| Dependency scanning & patching | ✅ | Dependabot weekly (`.github/dependabot.yml`); `npm audit` reviewed. |
| Multi-tenancy & data isolation | 🟡 | `org_id` on every table; every service query enforces org scope (unit-tested). RLS `FORCE` deferred — needs per-request `SET app.org_id` wiring; app-level scoping is the primary, verified control. |
| PII handling · retention · deletion | ⏳ M11 | Policy + erasure workflow. |
| Audit trails & tamper-evident logging | ✅ | sha256 hash chain, per-org advisory lock, in-transaction writer + verifier; unit-tested. |
| Security headers (CSP/HSTS/X-Frame-Options) | ✅ | `next.config` headers: HSTS (preload), CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. |

## Testing & CI
| Item | Status | Notes |
|---|---|---|
| Unit / integration / e2e / regression | 🟡 | 39 Vitest tests (RBAC, audit chain, quote math, pipeline, SLA, rate-limit); Playwright e2e is future. |
| Load & stress · chaos/resilience | ⏳ | k6 load + failure-mode tests (future); graceful degradation in place. |
| CI enforcement (block merge on fail) | ✅ | GitHub Actions: lint, typecheck, test, build on push/PR. |
| Code review standards (lint/typecheck/conventions) | ✅ | ESLint flat + strict TS; green. |

## Reliability & resilience
| Item | Status | Notes |
|---|---|---|
| Error handling & graceful degradation | ✅ | App + global error boundaries, `not-found`, `/api/health`; env fails fast; server actions return typed errors. |
| Retry + backoff **and** idempotency | 🟡 | Atomic `number_sequences` (no dup docs); idempotency keys on all mutations is future. |
| Circuit breakers & fallback | 🟡 | AI: try/catch + deterministic heuristic fallback; broader breakers for email/external later. |
| Concurrency & race-condition prevention | ✅ | `SELECT … FOR UPDATE` number allocation + per-org advisory-locked audit; optimistic concurrency on quotes (M5). |
| Caching strategy & invalidation | 🟡 | `revalidatePath` on every mutation; authed pages are dynamic; read-cache/CDN later. |
| RTO/RPO · DR · backups | 🟡 | Neon PITR; Vercel instant rollback; DR runbook `docs/runbooks/dr.md` (RPO ≤5m, RTO ≤30m). |

## Architecture & docs
| Item | Status | Notes |
|---|---|---|
| Accessibility (WCAG) | 🟡 | Radix primitives, focus rings, reduced-motion; axe pass in M11. |
| ADRs | 🟡 | `docs/adr/0001` (stack); more per milestone. |
| Architecture diagrams | 🟡 | Overview in plan; ERD as schema grows. |
| API contracts | ⏳ M2 | Typed contracts under `docs/api-contracts/`. |
