# Conduit

**The control layer for systems integrators.** A production-grade, web-based CRM
for a systems-integration & trading/contracting business operating across BMS,
LCS, Home Automation, EMS, BTU metering, HVAC controls, ELV, trading, project
contracting, AMC and PPM.

Conduit covers the full lifecycle — lead → opportunity → technical quotation →
project execution → AMC/PPM & service operations — with the documents,
approvals, permissions and numbers each stage actually demands.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript |
| Styling | Tailwind v4 · CSS-variable design tokens · dark/light |
| Database | Neon Postgres (pooled) · Drizzle ORM + Drizzle Kit |
| Auth | Clerk (organizations) — *M2* |
| Validation | Zod (shared client/server) |
| Deploy | Vercel · GitHub |

## Getting started

```bash
cp .env.example .env.local   # fill in Neon (and later Clerk) values
npm install
npm run db:migrate           # apply migrations to Neon
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |
| `npm run db:generate` | Generate SQL migration from schema |
| `npm run db:migrate` | Apply migrations (direct/unpooled URL) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed data |

## Structure

```
src/
  app/                 # routes — (app) shell + dashboard, marketing landing
  components/          # ui primitives, shell, marketing
  db/                  # drizzle schema, migrations, seed
  lib/                 # env, utils, nav
docs/                  # design system, ADRs, (security/testing/api per milestone)
```

## Project state

See [progress.md](progress.md), [roadmap.md](roadmap.md),
[changelog.md](changelog.md), [deployment-log.md](deployment-log.md) and
[PRODUCTION-HARDENING.md](PRODUCTION-HARDENING.md).

Current milestone: **M1 — Foundation** ✅ · Next: **M2 — Auth, roles &
permissions**.
