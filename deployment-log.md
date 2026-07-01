# Conduit — Deployment Log

One entry per milestone deploy. Authored by Basel Mahmoud.

---

## M1 — Foundation

- **Date:** 2026-06-30
- **Scope:** Project foundation — framework, database, design system, app shell,
  marketing landing.
- **Schema changes:** migration `0000` — `organizations`, `users`, `roles`,
  `permissions`, `role_permissions`, `user_roles`, `audit_log`,
  `activity_events`, `number_sequences` (applied to Neon `flat-lab-71747634`).
- **API changes:** none yet (REST surface begins M2).
- **UI changes:** design-token system; instrument shell (sidebar + topbar);
  `/dashboard` command center; redesigned landing with live control schematic.
- **Security/testing:** typecheck + lint gates green; `.env*` gitignored
  (`.env.example` committed); audit-log hash-chain columns in place for M2.
- **Known limitations:** no auth yet (routes open until M2); dashboard data is
  illustrative; mobile off-canvas nav pending.
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm (private).
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · 200).
- **Next:** M2 — Clerk auth, organizations, RBAC matrix + guard, audit writes.

---

## M2 — Auth & RBAC

- **Date:** 2026-06-30
- **Scope:** Authorization engine, audit, seed, admin surface, tests, CI.
- **Schema changes:** none (uses the M1 platform tables).
- **Logic:** RBAC guard (`requirePermission`/`can`), 48-permission catalog, 11 roles
  + 178 grants, audit hash-chain writer (+ verify), atomic number allocator, and the
  auth-context resolver (Clerk-ready + dev fallback).
- **UI:** Admin → Users & Roles (real data, permission-gated); shell shows real user.
- **Data:** idempotent seed applied to Neon (org, roles, grants, owner, sequences).
- **Security/testing:** 15 Vitest unit tests (RBAC + audit chain); GitHub Actions CI
  (lint, typecheck, test, build); per-org advisory-locked audit; `FOR UPDATE` sequences.
- **Known limitations:** Clerk live login pending key provisioning (dev-auth fallback
  resolves the seeded admin); team-scope filtering refined with the data layer (M3+).
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · `/admin` DB-backed, 200).
- **Next:** M3 — Accounts & contacts (8 account types).

---

## M3 — Customer Database

- **Date:** 2026-06-30
- **Scope:** Accounts (8 types) + contacts — first real CRM module with full CRUD.
- **Schema changes:** migration `0001` — `accounts` (8-type enum, rating, status,
  address, owner), `contacts` (applied to Neon).
- **Logic:** org-scoped service (tenant isolation), RBAC-guarded + audit-logged
  mutations in transactions, activity-timeline events, Zod validation, server actions.
- **UI:** accounts list (search + type filter), detail (info/contacts/activity),
  create + edit forms, soft-delete; reusable form primitives + badges.
- **Data:** idempotent demo seed — 8 GCC accounts + 3 contacts.
- **Security/testing:** 20 Vitest tests (added account validation); create/delete
  verified end-to-end against Neon incl. audit hash-chain links.
- **Known limitations:** team-scope still resolves broadly (refined when
  assignments land); Postgres RLS deferred to M11 (app-level scoping enforced now).
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · `/accounts` DB-backed, 200).
- **Next:** M4 — Leads & opportunities (pipeline + kanban).

---

## M4 — Leads & Opportunities

- **Date:** 2026-06-30
- **Scope:** Lead capture + qualification, opportunity pipeline with kanban,
  lead→opportunity conversion.
- **Schema changes:** migration `0002` — `leads` (source/status/project-type,
  est. value, follow-up, consultant/contractor links) + `opportunities` (9-stage,
  probability, approvals, competitor, expected close).
- **Logic:** org-scoped RBAC + audit CRUD for both; atomic `LEAD-####` / `OPP-####`
  numbering; `updateStage` (kanban + Won/Lost) with stage-default probability and
  closed_at; conversion copies account/value and links both records.
- **UI:** leads list/detail/create/edit (+ convert), opportunities kanban board
  (native DnD, optimistic + server-persisted), opp detail/create/edit, Won/Lost.
- **Data:** demo seed — 4 leads + 6 opportunities across stages.
- **Security/testing:** 28 Vitest tests; stage-change verified against Neon
  (Won → won/100%/closed_at + `opportunity.stage` audit entry).
- **Known limitations:** drag-and-drop is HTML5-native (no touch DnD yet); meeting
  records folded into the activity timeline.
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · `/opportunities` + `/leads` DB-backed, 200).
- **Next:** M5 — Quotation engine (BOQ, cost build-up, margin, approvals, PDF).

---

## M5 — Quotation Engine

- **Date:** 2026-06-30
- **Scope:** The crown jewel — BOQ quotations from opportunities, with exact
  costing, margin, discount approvals, revisions, and PDF.
- **Schema changes:** migration `0003` — `quotations`, `quotation_revisions`
  (cached totals), `quotation_lines` (4-way cost build-up), `discount_approvals`.
- **Logic:** `calc.ts` exact integer-cent math (6 golden tests); org-scoped RBAC +
  audit service (create-from-opp, save revision + recompute, new revision/clone,
  status workflow, discount approval); atomic `QT-####` numbering.
- **UI:** quotations list; detail with the live **BOQ builder** (editable cost
  build-up + margin for cost-viewers, read-only price view otherwise — the M2
  field-level gate), discount-approval banner, revisions, activity; "Create
  quotation" on opportunities.
- **PDF:** `@react-pdf/renderer` customer quote (prices only) via
  `/quotations/[id]/pdf` — verified valid PDF, exact totals.
- **Security/testing:** 34 Vitest tests; cost/margin hidden from non-cost-viewers
  and from the customer PDF; discounts >5% require approval before send.
- **Known limitations:** email send is a follow-up (PDF download in place); line
  drag-reorder not yet (section + order fields exist).
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · `/quotations` + PDF route verified, 200).
- **Next:** M6 — Project execution (register won quote → project, milestones, snags).

---

## M6 — Project Execution

- **Date:** 2026-06-30
- **Scope:** Turn won quotations into delivery — the project control room.
- **Schema changes:** migration `0004` — `projects`, `project_phases` (5 standard),
  `project_milestones`, `snags`.
- **Logic:** register-from-quotation (auto `PRJ-####`, contract value from the
  quote's current revision, marks quote won, seeds the 5 phases); standalone
  create; phase save (status + progress, auto start/complete timestamps);
  milestone add/toggle; snag add + status; org-scoped RBAC + audit throughout.
- **UI:** projects list (progress bars); the **Project Control Room** (execution
  phases editor, milestone tracker, snag list with inline status, activity, stats);
  "Register project" on the quotation detail.
- **Data:** demo seed — `PRJ-0001` (5 phases, 3 milestones, 2 snags).
- **Security/testing:** 34 Vitest tests; control room verified vs Neon.
- **Known limitations:** document attachments deferred to the Document Center;
  multi-assignee teams folded into PM + site-engineer for now.
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** https://conduit-crm-eta.vercel.app (production, READY · `/projects` control room verified, 200).
- **Next:** M7 — AMC/PPM & service operations.

---

## M7 — AMC/PPM & Service

- **Date:** 2026-06-30
- **Scope:** After-sales & recurring revenue — maintenance contracts and the
  service desk.
- **Schema changes:** migration `0005` — `contracts`, `assets`, `ppm_visits`,
  `service_tickets`.
- **Logic:** contracts (register-from-project auto `AMC-####`, profitability),
  asset registry, PPM visit scheduling/completion; service tickets with
  priority-driven SLA (P1–P4) due dates, self-dispatch, status workflow, resolve
  + CSAT; org-scoped RBAC + audit; atomic `AMC-####` / `TKT-####`.
- **UI:** contracts list + detail (assets + PPM visits + profitability); service
  desk (SLA badges + past-SLA banner) + ticket detail (assign/resolve/CSAT);
  "Register AMC" on the project control room.
- **Data:** demo seed — `AMC-0001` (3 assets, 3 visits) + 3 tickets (incl. a
  breached P1).
- **Security/testing:** 34 Vitest tests; SLA monitoring + contract profitability
  verified vs Neon.
- **Known limitations:** signed service reports & spare-parts deduction deferred
  (spare parts tie into M8 inventory).
- **GitHub:** https://github.com/basel-mahmoud/conduit-crm
- **Vercel:** _deploying…_
- **Next:** M8 — Inventory & equipment database.
