# Conduit

**The control layer for systems integrators.** A production-grade, web-based CRM
for a systems-integration & trading/contracting business operating across BMS,
LCS, Home Automation, EMS, BTU metering, HVAC controls, ELV, trading, project
contracting, AMC and PPM.

**Live:** https://conduit-crm-eta.vercel.app · **Status:** 10 of 12 milestones on
production.

Conduit covers the full lifecycle — lead → opportunity → technical quotation →
project execution → AMC/PPM & service — with the documents, approvals,
permissions and numbers each stage actually demands.

## What works today

The complete core revenue chain is live and functional:

**lead → opportunity → quotation (+ PDF) → won → project delivery → AMC/PPM & service**

- **Auth & RBAC** — 48-permission catalog, 11 system roles with record scopes,
  field-level cost/margin gating, tamper-evident hash-chained audit log.
- **Customer database** — 8 account types, contacts, activity timelines.
- **Leads & opportunities** — capture, lead→opportunity conversion, a 9-stage
  **kanban pipeline** with drag-and-drop and weighted forecast.
- **Quotation engine** — BOQ builder with 4-way cost build-up (material / labor /
  engineering / subcontractor), exact integer-cent money math, margin, discount
  approvals, revisions, and **customer PDF** generation.
- **Project execution** — register a won quote as a project, a **control room**
  with the 5 execution phases (procurement → engineering → installation → T&C →
  handover), milestone tracker and snag list.
- **AMC/PPM & service** — maintenance contracts with profitability, an asset
  registry, PPM visit scheduling, and service tickets with **priority-driven SLA
  monitoring** (P1–P4), dispatch, resolution and CSAT.
- **Inventory & equipment** — a unified product/equipment catalog (SKU,
  manufacturer, model, cost/sell, lead time, specs), a stock ledger with
  **low-stock alerts**, and purchase orders that **receive into stock**.
- **Reports & dashboards** — a **live** command center (real KPIs, pipeline by
  stage, needs-attention, activity) and a reports center (win rate, AMC
  profitability, SLA compliance, inventory valuation, won by system type).
- **AI assistance** — opportunity health scoring + next-best-action + draft
  follow-up emails, and lead qualification assist, via a provider-abstracted
  gateway (Anthropic Claude, with deterministic fallbacks). Suggestion-only,
  explainable, and audited.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript |
| Styling | Tailwind v4 · CSS-variable design tokens · dark/light |
| Database | Neon Postgres (pooled) · Drizzle ORM + Drizzle Kit |
| Auth | Clerk (organizations) — wired & gated; dev-auth fallback until keys are set |
| Validation | Zod (shared client/server) |
| PDF | @react-pdf/renderer (server) |
| Testing | Vitest (34 tests) · GitHub Actions CI (lint · typecheck · test · build) |
| Deploy | Vercel · GitHub |

## Getting started

```bash
cp .env.example .env.local   # fill in Neon (and later Clerk) values
npm install
npm run db:migrate           # apply migrations to Neon
npm run db:seed              # seed org, roles, and demo data
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |
| `npm run test` | Vitest |
| `npm run db:generate` | Generate SQL migration from schema |
| `npm run db:migrate` | Apply migrations (direct/unpooled URL) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed org, roles, permissions, and demo data |

## Structure

```
src/
  app/(app)/           # authed shell + module routes
  app/(marketing)/     # landing
  components/          # ui primitives, shell, per-module components
  modules/<domain>/    # accounts, leads, opportunities, quotations, projects …
                       #   (labels, schema/zod, service, actions, calc)
  server/              # auth, rbac (guard + matrix), audit (hash chain), sequences
  db/                  # drizzle schema, migrations, seed
  lib/                 # env, utils, format, nav
docs/                  # design system, ADRs
tests/                 # vitest suites
```

## Milestones

- [x] **M0** — Architecture & design direction
- [x] **M1** — Foundation (Next 16, Neon/Drizzle, design system, shell, landing)
- [x] **M2** — Auth, roles & permissions (RBAC, audit, admin)
- [x] **M3** — Customer database (accounts & contacts)
- [x] **M4** — Leads & opportunities (kanban pipeline)
- [x] **M5** — Quotation engine (BOQ, cost build-up, margin, approvals, PDF)
- [x] **M6** — Project execution (control room, phases, milestones, snags)
- [x] **M7** — AMC/PPM & service operations (contracts, assets, SLA tickets)
- [x] **M8** — Inventory & equipment database (catalog, stock ledger, POs)
- [x] **M9** — Reports & dashboards (real cross-module data)
- [x] **M10** — AI assistance (scoring, next-action, email drafting)
- [ ] **M11** — Hardening, testing, security, performance
- [ ] **M12** — Production readiness & rollout

## Project state

See [progress.md](progress.md), [roadmap.md](roadmap.md),
[changelog.md](changelog.md), [deployment-log.md](deployment-log.md) and
[PRODUCTION-HARDENING.md](PRODUCTION-HARDENING.md).

Current: **M10 — AI Assistance** ✅ · Next: **M11 — Hardening & security**.
