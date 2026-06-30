# Conduit — Design System

**Identity: "Technical Command Center."** Precision instrumentation for
engineers — calm, dense, trustworthy. Reference bar: Linear / Vercel / Stripe
dashboard craft, applied to controls & contracting. Not a marketing dashboard.

## Tokens (`src/app/globals.css`)

Raw values in `:root` / `.dark`; semantic aliases mapped in `@theme inline`
(shadcn-compatible naming). Class-based dark mode via `@custom-variant dark`.

- **Surfaces:** warm paper (`#fafaf8`) / clean ink (`#14171a`) in light;
  near-black (`#0b0d10`) / `#e8eaed` in dark. Hairline borders, not heavy shadow.
- **Brand / signal:** controls-blue (`--brand`), instrument teal (`--accent`),
  semantic success / warning / danger. **Restrained strategy** — one accent
  carries identity; signal colors are functional (SLA, health, deltas).
- **Sidebar:** always a deep instrument panel in both themes (`--sidebar*`).
- **Radius:** `--radius: 0.5rem` (low — industrial, not pill-shaped).
- **Elevation:** `--shadow-sm/md/lg` (subtle; depth from borders + tight shadow).

## Typography

- **Geist** (UI/display) + **Geist Mono** (technical data). The mono is the
  signature: quote numbers, model numbers, money, codes, readouts — all tabular,
  slashed-zero (`font-variant-numeric: tabular-nums slashed-zero`).
- Display headings: `clamp()` max ≤ ~4.25rem, tracking `-0.04em`, `text-balance`.
- Body on dark uses brighter ink (`--ink-2`) for ≥4.5:1 contrast.

## Motion (CSS-first, reduced-motion safe)

- Custom ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; entrances ≤ 600ms; UI ≤ 300ms.
- Only `transform` / `opacity` / `stroke-dashoffset` / `box-shadow` animated.
- Staggered `rise-in` reveals (50–70ms); continuous `signal` flow (linear) along
  schematic conduits; `core-glow` and `node-dot` loops.
- Buttons: `:active scale(0.98)`. Every animation has a
  `prefers-reduced-motion: reduce` off-switch.

## Components

- `ui/button.tsx` — CVA variants (primary/secondary/outline/ghost/danger), sizes.
- `shell/` — sidebar (grouped nav, active state, "soon" tags), topbar, logo mark.
- `marketing/control-schematic.tsx` — live building-control single-line diagram
  (HTML chips + SVG conduits/pulses on one 560×600 coordinate system).

## Anti-slop guardrails (enforced)

No per-section uppercase eyebrows · no `01/02/03` section scaffolding · no
identical card grids · no centered hero template · no gradient text · no
side-stripe borders. Mono is justified here (genuinely technical domain), not
costume. Imagery requirement met by the custom animated schematic.
