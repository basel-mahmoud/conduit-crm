# ADR-0002 — Provider-agnostic auth with a dev-auth fallback

- **Status:** Accepted
- **Date:** 2026-06-30

## Context
Clerk is the mandated identity platform, but provisioning a Clerk app + keys is a
manual, account-level step. Blocking all development and deployment on that would
stall every downstream milestone (RBAC, all CRM modules).

## Decision
Resolve identity through a single `getAuthContext()` abstraction
(`src/server/auth/context.ts`):
- **Clerk mode** when `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are
  set — identity comes from the Clerk session.
- **Dev-auth fallback** otherwise — resolves the seeded owner/admin so the product
  is fully usable and deployable before keys exist.

The app's RBAC is the source of truth for fine-grained checks; Clerk provides
authentication + orgs. Cutover is env-only for the context (mounting Provider +
middleware + webhook is documented in `docs/runbooks/go-live.md`).

## Consequences
- Every milestone shipped and deployed on schedule without an external blocker.
- The deployed demo runs as the seeded admin — acceptable for a private,
  pre-launch product; dev-auth auto-disables the moment Clerk env is present.
- No code churn to enable real auth — only configuration + the documented mount.
