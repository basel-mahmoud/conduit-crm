# ADR-0001 — Technology Stack

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

Conduit is a production-grade CRM for a systems-integration / trading /
contracting business, operated by a single owner but architected like a
commercial SaaS. It must be secure, scalable, maintainable, and exceptional in
UI quality, with Neon and Clerk as mandated platform choices.

## Decision

**Modular monolith on Next.js 16 (App Router, RSC), deployed to Vercel.**

- **Next.js 16 + TypeScript + Tailwind v4** — one deployable; server-first data;
  `/api/v1` REST + Server Actions for mutations. (Note: Next 16 specifics —
  Turbopack default, fully-async request APIs, `middleware`→`proxy`.)
- **Neon Postgres + Drizzle ORM/Kit** — mandated DB; SQL-first, fully typed,
  transparent migrations. Pooled URL at runtime, direct URL for migrations.
  `neon-serverless` Pool driver chosen over `neon-http` for real interactive
  transactions (audit hash-chain + number-sequence allocation need read-then-
  write atomicity).
- **Clerk (organizations)** — mandated auth; org = tenant, Clerk role → app RBAC
  (app RBAC is the source of truth for fine-grained checks). _Wired in M2._
- **Zod** for shared client/server validation; **TanStack Query/Table** for data
  UX; **Radix** primitives heavily restyled; **Motion/CSS** for animation;
  **@react-pdf** for quotation PDFs; **Resend** email; **Upstash** rate-limit/
  cache; **Anthropic Claude** behind an AI gateway; **Sentry** observability.

## Consequences

- Single repo/deploy keeps a solo operator productive; no premature microservices.
- Multi-tenant-ready from row one (`org_id` everywhere) — SaaS later is a config
  flip, not a rewrite.
- Serverless constraints respected: pooled connections, no long-running
  processes (jobs via QStash + cron), PDF via `@react-pdf` (no headless Chrome).
