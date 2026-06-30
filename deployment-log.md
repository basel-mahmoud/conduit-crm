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
- **GitHub:** _pending first push._
- **Vercel:** _pending first deploy._
- **Next:** M2 — Clerk auth, organizations, RBAC matrix + guard, audit writes.
