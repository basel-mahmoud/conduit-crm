# Go-Live Checklist

Conduit is deployed and running with **real Clerk authentication** (see §1).
This runbook records what's done and the optional hardening that remains.

## 1. Authentication — Clerk cutover ✅ DONE

Real Clerk auth is wired and **verified end-to-end in production** (owner signs in
with Google → admin dashboard). What's in place:

- Clerk application **Conduit** (dev instance, Frontend API
  `relaxing-koi-53.clerk.accounts.dev`); keys in `.env.local` and Vercel prod
  (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, sign-in/up URLs, and
  `/dashboard` fallback redirects).
- `src/proxy.ts` (Next 16 middleware) runs `clerkMiddleware()` and protects every
  route except the public set (`/`, `/sign-in`, `/sign-up`, `/api/health`,
  `/api/webhooks/*`). Gated on keys, so dev-auth still works when keys are absent.
- `<ClerkProvider>` in the root layout; `/sign-in` + `/sign-up` catch-all routes;
  `UserButton` (sign-out) in the topbar.
- Identity resolution (`src/server/auth/context.ts` + `src/server/auth/sync.ts`):
  fast-path by Clerk id, else **link by email** to an existing row (the owner), else
  **JIT-provision** a new user with **no roles** (an admin grants access).
- The CSP in `next.config.ts` allows the Clerk Frontend API + Cloudflare Turnstile
  (required — the original CSP blocked ClerkJS).

**Optional follow-ups:** register the `/api/webhooks/clerk` endpoint in Clerk (set
`CLERK_WEBHOOK_SIGNING_SECRET`) for real-time user sync; restrict sign-ups
(Clerk → Restrictions) to invite-only; promote to a Clerk **production** instance
when moving to a custom domain (add its host to the CSP).

## 2. Environment
- Confirm `DATABASE_URL` / `DATABASE_URL_UNPOOLED` on Vercel (already set).
- Optional: `GEMINI_API_KEY` (+ `AI_MODEL`) to switch AI from heuristic → Gemini.
- Rotate the seeded Neon credentials before real data; keep secrets out of the repo.

## 3. Data
- The seed is **demo data**. For production, clear demo rows (or start a fresh Neon
  branch) and load real accounts/products via the app or a CSV import script.
- `npm run db:migrate` applies the schema to any environment.

## 4. Domain & TLS
- Add a custom domain in Vercel → Domains; point DNS (CNAME/A) as instructed.
- TLS + HSTS are automatic (HSTS preload header already set).

## 5. Monitoring & observability
- Add Sentry (`@sentry/nextjs` + `SENTRY_DSN`) for error + performance tracing.
- Point an uptime monitor at `GET /api/health` (200 healthy / 503 degraded).
- Watch Vercel runtime logs + Neon metrics.

## 6. Backups / DR
- Confirm Neon PITR retention for the plan; schedule the quarterly restore drill
  (`docs/runbooks/dr.md`). RPO ≤ 5m, RTO ≤ 30m.

## 7. Pre-launch smoke test
- CI green (lint · typecheck · test · build).
- Walk the core chain: lead → opportunity → quotation (+ PDF) → won → project →
  AMC → service ticket → inventory/PO → dashboard/reports.
- Verify RBAC: a non-cost-viewer cannot see margin; a non-admin cannot open
  `/admin`.
