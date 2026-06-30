# Changelog

All notable changes to Conduit. Format follows *Keep a Changelog*; newest first.

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
