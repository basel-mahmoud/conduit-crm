# Changelog

All notable changes to Conduit. Format follows *Keep a Changelog*; newest first.

## [1.3.0] — Documents, Settings & green CI — 2026-07-02

### Added
- **Documents** (`/documents`) — a document register listing every generated
  quotation PDF (searchable; number, customer, status, value, date; view +
  download-PDF actions), RBAC-gated on `quotation.read`.
- **Settings** (`/settings`) — organization profile (editable name via an
  RBAC-gated server action; slug/currency/VAT/fiscal/created), a your-account
  summary, and system status (auth mode, AI provider, tenancy). Both nav items
  lost their "soon" flag — the app has no placeholder pages left.

### Fixed
- **CI was failing on every push** at `npm ci`: the committed lockfile (npm 11)
  was missing `esbuild@0.28.1` platform entries that CI's npm 10 required.
  Regenerated a complete lockfile and moved CI to node 24 (npm 11) so it matches
  the generating environment. Vercel (npm install) was never affected.
- Cleared the Dependabot backlog: merged the checkout + setup-node action bumps,
  closed the grouped npm bump (it upgraded ESLint past the react-plugin rule API).
  Main CI is green; no open PRs.

## [1.2.0] — AI on Google Gemini — 2026-07-01

Switched the AI gateway from Anthropic Claude to **Google Gemini** (free tier).

### Changed
- `src/server/ai/gateway.ts` now calls Gemini `generateContent`
  (`gemini-2.5-flash`, thinking disabled so the token budget goes to the answer),
  gated on `GEMINI_API_KEY`; the deterministic heuristic fallback is unchanged.
- `callClaude` → `callModel`; the assist source badge reads **Gemini**; docs
  (`ai.md`, ADR-0001, go-live) and `.env.example` updated.

### Verified
- Live in production: opportunity AI assist returns a real, context-aware score +
  assessment + next action + draft email, with a **Gemini** source badge.

## [1.1.0] — Real authentication (Clerk cutover) — 2026-07-01

Switched from dev-auth to **real Clerk authentication**, live in production.

### Added
- Clerk app provisioned; keys wired in `.env.local` + Vercel prod.
- `src/proxy.ts` (Next 16 middleware) protecting all routes except the public set;
  `<ClerkProvider>` in the root layout (gated on keys); `/sign-in` + `/sign-up`
  routes; `UserButton` sign-out in the topbar.
- `/api/webhooks/clerk` (Svix-verified) plus JIT/email-link user provisioning
  (`src/server/auth/sync.ts`) — a signed-in user is linked to an existing row by
  email or created on first request; new users get no roles until an admin grants.

### Fixed
- CSP (`next.config.ts`) now allows the Clerk Frontend API + Cloudflare Turnstile;
  the M11 CSP had blocked ClerkJS from loading.

### Verified
- End-to-end in the browser: Google sign-in → SSO callback → admin dashboard;
  protected routes redirect to `/sign-in`; landing/health stay public.

## [1.0.0] — M12 Production Rollout — 2026-07-01

**All 12 milestones complete.** Conduit reaches v1.0 — a full systems-integration
CRM covering leads → opportunities → quotations → projects → AMC/PPM/service →
inventory, with RBAC, tamper-evident audit, reports, and AI assist.

### Added
- **Go-live runbook** (`docs/runbooks/go-live.md`) — Clerk cutover, environment,
  data, domain/TLS, monitoring, backups/DR, and a pre-launch smoke test.
- **ADR-0002** (provider-agnostic auth + dev-auth fallback) and **ADR-0003**
  (exact integer-cent money math + hash-chained audit) recording the two
  foundational decisions.

### Verified (final regression)
- Lint, typecheck, 39 tests, and production build all green.
- All 13 production routes return 200; security headers + `/api/health` confirmed
  live on https://conduit-crm-eta.vercel.app.

## [0.11.0] — M11 Hardening & Security — 2026-07-01

### Added
- **Security headers** (`next.config`): HSTS (preload), CSP, X-Frame-Options DENY,
  X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.
- **Rate limiting** (`src/server/rate-limit.ts`) — fixed-window limiter applied to
  the AI endpoints.
- **Error handling** — app + global error boundaries, `not-found`, and a
  `/api/health` check (DB ping → 200/503).
- **Dependabot** (weekly npm + actions) and a **DR runbook** (`docs/runbooks/dr.md`,
  RPO ≤5m / RTO ≤30m).
- +5 tests (rate-limit, SLA state, multi-entry audit-chain tamper detection) — 39
  total.
- `PRODUCTION-HARDENING.md` refreshed to reflect the shipped state.

### Verified
- `/api/health` returns `{status:"ok",db:true}`; 39 tests + typecheck + lint +
  build green.

## [0.10.0] — M10 AI Assistance — 2026-07-01

### Added
- **AI gateway** (`src/server/ai/gateway.ts`) — provider abstraction over
  Anthropic Claude; used when `ANTHROPIC_API_KEY` is set, deterministic
  heuristics otherwise (features work + upgrade transparently).
- **Opportunity assist** — health score, deal assessment, next-best-action, and a
  context-aware draft follow-up email.
- **Lead assist** — qualification recommendation, next action, and a draft
  outreach email.
- AI panel wired into the opportunity + lead detail pages (generate / regenerate /
  copy), with a source badge and a "review before sending" note.

### Governance
- Suggestion-only / human-in-the-loop; RBAC-scoped; **audited** (`ai.assist`)
  with feature + source but **not** prompt content (redaction). See `docs/ai.md`.

### Verified
- Panel scores an opportunity (25/100), assesses it, recommends a next step and
  drafts a contextual email — all from live data, no console errors.

## [0.9.0] — M9 Reports & Dashboards — 2026-06-30

### Added
- `reports/queries.ts` — real cross-module aggregations (org-scoped): pipeline,
  win/loss, quotation & project status, AMC profitability, SLA compliance,
  inventory valuation, won-by-system-type.
- **Dashboard rewired to live data** — real KPIs (leads, open opps + weighted,
  active quotes, won value, active contracts, open tickets + SLA breaches),
  pipeline-by-stage bars, real needs-attention (breached SLAs, renewals ≤45d,
  low stock) and recent activity. Removed the "illustrative" placeholder + fake
  deltas.
- **Reports center** (`/reports`, gated on `report.view`) — sales performance,
  AMC/PPM profitability, service SLA, inventory valuation, quotation & project
  status breakdowns, won by system type (CSS bar charts, no chart dependency).

### Verified
- Dashboard + reports render live data end-to-end (win rate 100%, SLA 100%,
  inventory AED 134.4K at cost, won BTU AED 680K).

## [0.8.0] — M8 Inventory & Equipment — 2026-06-30

### Added
- Inventory module (migration `0006`): unified products/equipment catalog,
  manufacturers, an append-only **stock ledger** (cached on-hand), low-stock
  alerts, and **purchase orders** (lines + receive → stock movement).
- Products carry SKU, category, manufacturer, model, cost/sell, lead time,
  reorder level, `specs` (jsonb), datasheet URL.
- `/equipment` — a searchable **technical equipment library** over the same
  catalog (controllers, DDCs, sensors, valves, meters…).
- RBAC + audit throughout; atomic `PO-####`; manufacturer upsert-by-name.
- Demo seed: 8 products, 3 manufacturers, `PO-2026-0001`.

### Verified
- Catalog renders with low-stock flagging; product detail shows margin, specs
  and the stock ledger; PO receive increments stock.

## [0.7.0] — M7 AMC/PPM & Service — 2026-06-30

### Added
- Contracts module (migration `0005`): AMC/PPM contracts, asset registry, PPM visit
  scheduling. **Register an AMC from a delivered project** (auto `AMC-####`) or
  create directly; contract profitability (value − annual cost).
- Service module: breakdown / request / PPM tickets with priority-driven SLA
  targets (P1–P4), auto SLA due date, self-dispatch, status workflow, resolution
  + CSAT.
- **SLA monitoring** — per-ticket state (on-track / due-soon / breached / met) and
  a "past SLA" banner on the service desk.
- RBAC + audit throughout; atomic `AMC-####` / `TKT-####` numbering.
- Demo seed: `AMC-0001` (3 assets, 3 PPM visits) + 3 service tickets.

### Verified
- Service desk renders SLA states incl. a breached P1; contract shows
  profitability AED 48,000, the asset registry and PPM visits.

## [0.6.0] — M6 Project Execution — 2026-06-30

### Added
- Projects module (migration `0004`): projects + 5 execution phases + milestones
  + snags. **Registered from a won quotation** (auto `PRJ-####`, contract value
  from the quote, quotation marked won) or created standalone — phases auto-seeded.
- **Project Control Room**: execution phases with live progress bars + status
  (procurement → engineering → installation → T&C → handover), milestone tracker
  (toggle done), snag list (severity + inline status change), activity, stats.
- RBAC + audit on all writes; org-scoped; overall progress = avg of phase progress.
- Demo seed: `PRJ-0001` from `QT-2026-0001` (5 phases, 3 milestones, 2 snags).

### Verified
- Control room renders real data: contract value AED 231,770 carried from the
  quotation, 40% overall progress, phases/milestones/snags live.

## [0.5.0] — M5 Quotation Engine — 2026-06-30

### Added
- Quotations module (migration `0003`): quotations + revisions + BOQ lines +
  discount approvals. Created from an opportunity (auto `QT-####`).
- **Exact money math** in integer cents (`calc.ts`) — 4-way cost build-up
  (material/labor/engineering/subcontractor), markup, margin, discount, VAT;
  6 golden tests.
- **BOQ builder**: live editable cost build-up with real-time totals + margin;
  read-only price view for non-cost-viewers (the M2 field-level gate in action).
- **Discount-approval workflow** (>5% needs management approval; gates send/approve).
- Revisions (immutable once superseded; "New revision" clones the current).
- Status workflow (draft → sent → won/lost) gated on discount approval.
- **PDF generation** (`@react-pdf/renderer`) — professional customer-facing quote,
  prices only (no cost/margin).
- Demo seed: `QT-2026-0001`, a 6-line BMS BOQ (grand AED 231,769.86).
- 34 Vitest tests total.

### Verified
- PDF route returns a valid `application/pdf` with exact totals
  (231,769.86); builder renders the cost build-up with live margin.

## [0.4.0] — M4 Leads & Opportunities — 2026-06-30

### Added
- Leads module (migration `0002`): capture (source, consultant/contractor,
  project type, est. value, follow-up), org-scoped RBAC + audit CRUD, server
  actions, list (search + status filter) / detail / create / edit, and an atomic,
  audited lead → opportunity conversion.
- Opportunities module: 9-stage pipeline, probability, value, expected close,
  consultant/contractor approvals, competitor; RBAC + audit CRUD; Won/Lost actions.
- Kanban pipeline board — native drag-and-drop, optimistic UI + server-persisted
  via `moveStageAction`, per-stage totals and weighted forecast.
- Atomic ref-number allocation for leads (`LEAD-####`) and opportunities (`OPP-####`).
- Demo seed: 4 leads + 6 opportunities across stages.
- 8 Vitest tests (lead/opp validation, stage metadata) — 28 total.

### Verified
- Against Neon: stage change (Won) → `stage=won`, `probability=100`, `closed_at`
  set, `opportunity.stage` audit entry written. Pipeline renders live data.

## [0.3.0] — M3 Customer Database — 2026-06-30

### Added
- Accounts module (8 account types) + contacts: schema (`accounts`, `contacts`),
  migration `0001`, org-scoped service with RBAC guard + tamper-evident audit on
  every mutation, and activity-timeline events — all in one transaction.
- Server actions (create / update / soft-delete account, add contact) with Zod
  validation at the boundary.
- UI: accounts list (search + type filter chips), detail (company info, contacts,
  activity timeline), create + edit forms, delete. Reusable form primitives
  (input/select/textarea/field) and account badges.
- Idempotent demo seed: 8 GCC accounts + 3 contacts.
- 5 Vitest tests for account validation (20 total, all green).

### Verified
- End-to-end against Neon: create → activity event + audit chain entry
  (`seq 1`, `prev_hash null`); soft-delete → chain links (`account.create`,
  `account.delete`). Tenant-scoped reads, permission-gated writes.

## [0.2.0] — M2 Auth & RBAC — 2026-06-30

### Added
- RBAC engine: 48-permission catalog, 11 system roles with per-permission record
  scopes (own/team/branch/org), `resolveGrants` matrix merge, and a centralized
  server-side `requirePermission`/`can` guard incl. field-level cost/margin gate.
- Tamper-evident audit writer (`writeAudit`) — sha256 hash chain, per-org advisory
  lock, in-transaction; `verifyAuditChain`. Pure hash module unit-tested.
- Atomic document-number allocator (`allocateNumber`, `SELECT … FOR UPDATE`).
- Auth-context resolver: Clerk session when configured, seeded-admin dev fallback
  otherwise; `getCurrentUserDisplay` powers the shell's real user.
- Idempotent seed: Conduit org, permission catalog, 11 roles + 178 grants, owner
  admin, 7 document-number sequences (applied to Neon).
- Admin → Users & Roles page (real data, permission-gated); shell shows real user.
- Vitest + 15 unit tests (RBAC matrix, scope enforcement, cost-visibility, audit
  chain); GitHub Actions CI (lint, typecheck, test, build).

### Notes
- Clerk live login activates when keys are provisioned; until then the app runs in
  dev-auth mode (resolves the seeded owner/admin). The Clerk path is wired & gated.

## [0.1.0] — M1 Foundation — 2026-06-30

### Added
- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript scaffold.
- Tailwind v4 design-token system — "Technical Command Center" (light/dark
  parity), Geist + Geist Mono, motion utilities (CSS, reduced-motion safe).
- Neon Postgres wired via Drizzle ORM (neon-serverless Pool driver for real
  transactions) + Drizzle Kit migrations. Pooled runtime / direct migration URLs.
- Platform schema (migration `0000`): `organizations`, `users`, RBAC tables
  (`roles`, `permissions`, `role_permissions`, `user_roles`), `audit_log`
  (hash-chain columns), `activity_events`, `number_sequences`. Applied to Neon.
- App shell: instrument sidebar (grouped nav), topbar (search/notifications/
  theme toggle), and a `/dashboard` command center (illustrative data).
- Marketing landing: asymmetric hero with a live building-control single-line
  schematic (animated signal flow into the CRM core), datasheet lifecycle,
  drawing-legend module index, console close.
- `Button` primitive (CVA), theme provider (next-themes, class strategy).
- Project-state docs: README, progress, roadmap, deployment-log,
  PRODUCTION-HARDENING, DESIGN, ADR-0001.

### Notes
- Landing redesigned with the impeccable / emil-design-eng / ui-ux-pro-max
  design skills after a first pass read as generic; final passes the anti-slop
  bans (no per-section eyebrows, no 01/02/03 scaffold, no card grid, committed
  domain imagery + motion).
