# Conduit — Progress

Living status tracker. Updated every milestone.

## Status board

| Milestone | Scope | Status |
|---|---|---|
| M0 | Architecture, design direction, project-state docs | ✅ Done |
| M1 | Foundation: Next 16 + TS + Tailwind v4, Neon+Drizzle, design system, app shell, landing | ✅ Done |
| M2 | Auth, roles, organizations, RBAC, audit | ✅ Done |
| M3 | Accounts & contacts (8 account types) | ✅ Done |
| M4 | Leads & opportunities (+ kanban) | ✅ Done |
| M5 | Quotation engine + approvals + PDF | ✅ Done |
| M6 | Project execution | ⏭ Next |
| M7 | AMC / PPM / service | ◻ Planned |
| M8 | Inventory & equipment | ◻ Planned |
| M9 | Reports & dashboards (real data) | ◻ Planned |
| M10 | AI features | ◻ Planned |
| M11 | Hardening, testing, security, perf | ◻ Planned |
| M12 | Production rollout | ◻ Planned |

## Built so far (M0–M1)

- **Infra**: Neon project `conduit-crm` (`flat-lab-71747634`), pooled + direct
  connection wired. GitHub `basel-mahmoud/conduit-crm` (private). Vercel live:
  https://conduit-crm-eta.vercel.app (env vars set).
- **DB**: 9 platform tables live in Neon — `organizations`, `users`, `roles`,
  `permissions`, `role_permissions`, `user_roles`, `audit_log` (hash-chain
  ready), `activity_events`, `number_sequences`. Drizzle schema + migration 0000.
- **Design system**: "Technical Command Center" tokens (light/dark), Geist +
  Geist Mono, motion utilities (CSS, reduced-motion safe). See `docs/DESIGN.md`.
- **Shell**: instrument sidebar (grouped nav), topbar (search/notifications/
  theme), `/dashboard` command-center page (illustrative data).
- **Landing**: asymmetric hero with a live building-control single-line
  schematic (signal flowing along conduits into the CRM core), datasheet
  lifecycle, drawing-legend module index, console close. Designed with the
  impeccable / emil-design-eng / ui-ux-pro-max skills; passes anti-slop bans.
- **Quality**: typecheck + lint green; verified in-browser (dark + light).

## Open follow-ups

- Mobile sidebar (off-canvas) for `< lg` — sidebar currently hidden on small.
- Module-index legend has one empty trailing cell (cosmetic).
- `npm audit`: a few moderate transitive advisories — review in M11 hardening.
