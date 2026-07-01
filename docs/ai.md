# AI Features — Governance

AI in Conduit is **assistive, governable, and explainable**. It never automates
decisions or sends anything on its own.

## Architecture
- **Provider abstraction** (`src/server/ai/gateway.ts`): calls Google Gemini
  when `GEMINI_API_KEY` is set; otherwise deterministic **heuristics** produce
  the same output shapes. Features work with or without a key and upgrade
  transparently when a key is added.
- **Model**: `AI_MODEL` (default `gemini-2.5-flash`, free-tier; thinking disabled
  so the token budget is spent on the answer).

## Features (M10)
- **Opportunity assist** — health score, deal assessment, next best action, and a
  draft follow-up email, from real opportunity context.
- **Lead assist** — qualification recommendation, next action, and a draft
  outreach email.

## Governance
- **Suggestion-only / human-in-the-loop** — output is shown in a panel; the user
  reviews, edits and sends. Nothing is auto-applied or auto-sent.
- **Explainable** — score rationale + a source badge (Gemini vs heuristic).
- **Auditable** — each use writes an `ai.assist` audit entry + activity event with
  the feature and source, but **not the prompt content** (privacy/redaction).
- **Scoped** — gated by the same RBAC read permission as the underlying record.
- **Cost control** — fast model by default, short `max_tokens`, on-demand only
  (no background calls), graceful fallback on error/timeout.
