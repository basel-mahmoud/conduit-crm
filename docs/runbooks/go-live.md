# Go-Live Checklist

Conduit is deployed and fully functional in **dev-auth mode** (the auth context
resolves the seeded owner/admin). This runbook lists the steps to cut over to a
real, multi-user production launch.

## 1. Authentication — Clerk cutover (primary task)

The auth **context** already uses Clerk when keys are present
(`src/server/auth/context.ts`, `clerkEnabled`). To finish the wiring:

1. Create a Clerk application (dashboard.clerk.com), enable **Organizations**.
2. Set env (local `.env.local` **and** Vercel → Project → Environment Variables):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
3. Add the Clerk mounting (gated on `clerkEnabled` so dev-auth still works):
   - Wrap the root layout children in `<ClerkProvider>`.
   - Add `proxy.ts` (Next 16 middleware) running `clerkMiddleware()` to protect
     `/(app)` routes.
   - Add `/sign-in` and `/sign-up` routes.
   - Add a Clerk **webhook** route (`/api/webhooks/clerk`, verified with `svix`)
     that upserts users into the `users` table (id = Clerk user id) and assigns a
     default role via `user_roles`.
4. Seed the org's roles for real users (`npm run db:seed` already seeds the 11
   system roles + permission matrix; assign roles per user in **Admin → Users &
   Roles**).
5. Once verified, dev-auth auto-disables (it only runs when Clerk env is absent).

## 2. Environment
- Confirm `DATABASE_URL` / `DATABASE_URL_UNPOOLED` on Vercel (already set).
- Optional: `ANTHROPIC_API_KEY` (+ `AI_MODEL`) to switch AI from heuristic → Claude.
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
