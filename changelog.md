# Changelog

All notable changes to Conduit. Format follows *Keep a Changelog*; newest first.

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
