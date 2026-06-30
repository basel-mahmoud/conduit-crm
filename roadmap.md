# Conduit — Roadmap

Vertical-slice-first delivery: ship a usable, deployed product through the sales
lifecycle, then deepen module by module. Every milestone ends with
commit → GitHub → Vercel + a `deployment-log.md` entry.

| # | Phase | Goal | Key deliverables | Test gate |
|---|---|---|---|---|
| M0 | Discovery | Architecture & docs | Plan, design direction, state docs, ADRs | — |
| M1 | Foundation | Buildable shell | Next 16/TS/Tailwind, Drizzle+Neon, design system, shell, landing, CI | typecheck + lint |
| M2 | Auth & RBAC | Identity + permissions | Clerk orgs, user sync, role/permission matrix, guard middleware, audit | permission + isolation tests |
| M3 | Accounts | Customer database | 8 account types, contacts, comms log, detail pages, global search | unit + integration |
| M4 | Leads & Opps | Pipeline | Capture, state machines, kanban, follow-ups, timeline, attachments | workflow/transition tests |
| M5 | Quotations | Quote engine | BOQ builder, cost build-up, margin, discount approval, revisions, PDF, email | quote-math + approval tests |
| M6 | Projects | Delivery | Register from won quote, milestones, phases, snags, docs | won→project conversion |
| M7 | Service | AMC/PPM/tickets | Contracts, assets, PPM calendar, visits, reports, SLA tickets, dispatch | SLA/escalation + PPM tests |
| M8 | Catalog | Inventory & equipment | Catalog, stock ledger, PO/SO, equipment library + spec search | stock-deduction tests |
| M9 | Insight | Reports & dashboards | Materialized views, report suite, forecast, exports (real data) | data-correctness |
| M10 | AI | Assistance | AI gateway + 8 governed features, human-in-loop, prompt logging | guardrail tests |
| M11 | Hardening | Production quality | Load/chaos, a11y, security review, DR runbook, retention jobs | k6 + axe + audit |
| M12 | Rollout | Go-live | Seed/import tooling, runbooks, go-live checklist, monitoring | full regression |

## Principles

- **Multi-tenant-ready, single-tenant deployed** — every row carries `org_id`.
- **Money is exact** — `NUMERIC`, decimal handling, never floats.
- **Idempotent mutations** — keys on mutating endpoints; atomic DB number sequences.
- **Tamper-evident audit** — hash-chained, written in-transaction.
- **Server-side authorization** — one guard; client only hides what server forbids.
