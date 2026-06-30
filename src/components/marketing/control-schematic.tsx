import type { LucideIcon } from "lucide-react";
import { Gauge, Lightbulb, Lock, Snowflake, Wind, Zap } from "lucide-react";

import { ConduitMark } from "@/components/shell/logo";

/**
 * Live building-control single-line schematic — the hero centerpiece.
 * Field modules feed signal along "conduits" into the CRM core.
 * Lines/pulses are SVG; module chips + core are HTML, aligned to the same
 * 560×600 coordinate system via percentage positioning (container holds that
 * exact aspect ratio, so SVG user units and chip percentages coincide).
 */
const VBW = 560;
const VBH = 600;

const modules: { code: string; name: string; icon: LucideIcon }[] = [
  { code: "AHU·01", name: "Air Handling", icon: Wind },
  { code: "CHW·02", name: "Chiller Plant", icon: Snowflake },
  { code: "BTU·03", name: "BTU Metering", icon: Gauge },
  { code: "LCS·04", name: "Lighting", icon: Lightbulb },
  { code: "ELV·05", name: "ELV · Access", icon: Lock },
  { code: "EMS·06", name: "Energy", icon: Zap },
];

const CHIP = { x: 24, w: 176, h: 58, gapY: 96, startY: 44 };
const BUS_X = 330;
const CORE = { x: 393, y: 243, w: 150, h: 110 };
const CORE_CY = CORE.y + CORE.h / 2; // 298

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export function ControlSchematic() {
  return (
    <div
      className="relative mx-auto w-full max-w-[520px]"
      style={{ aspectRatio: `${VBW} / ${VBH}` }}
    >
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="blueprint"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M28 0H0V28"
              stroke="var(--hairline)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width={VBW} height={VBH} fill="url(#blueprint)" opacity="0.5" />

        {/* Vertical bus */}
        <path d={`M${BUS_X} 56V${CHIP.startY + 5 * CHIP.gapY + CHIP.h}`} stroke="var(--hairline-strong)" strokeWidth="1.5" />

        {/* Branches: base line + travelling signal + bus tap */}
        {modules.map((m, i) => {
          const cy = CHIP.startY + i * CHIP.gapY + CHIP.h / 2;
          return (
            <g key={m.code}>
              <path d={`M${CHIP.x + CHIP.w} ${cy}H${BUS_X}`} stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <path
                d={`M${CHIP.x + CHIP.w} ${cy}H${BUS_X}`}
                className="signal"
                stroke="var(--brand)"
                strokeWidth="1.75"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.34}s` }}
              />
              <circle cx={BUS_X} cy={cy} r="2.5" fill="var(--brand)" />
            </g>
          );
        })}

        {/* Bus → core feed */}
        <path d={`M${BUS_X} ${CORE_CY}H${CORE.x}`} stroke="var(--hairline-strong)" strokeWidth="1.5" />
        <path
          d={`M${BUS_X} ${CORE_CY}H${CORE.x}`}
          className="signal"
          stroke="var(--brand)"
          strokeWidth="2.25"
          strokeLinecap="round"
          style={{ animationDelay: "0.15s" }}
        />

        {/* Converging pulses along the bus toward the core */}
        <path d={`M${BUS_X} 73V${CORE_CY}`} className="signal" stroke="var(--brand)" strokeWidth="1.5" style={{ animationDelay: "0.1s" }} />
        <path d={`M${BUS_X} 553V${CORE_CY}`} className="signal" stroke="var(--brand)" strokeWidth="1.5" style={{ animationDelay: "0.55s" }} />

        {/* Title block */}
        <line x1="20" y1="582" x2="540" y2="582" stroke="var(--hairline)" />
        <text x="20" y="595" className="font-mono" fontSize="9" letterSpacing="0.5" fill="var(--muted)">
          CONDUIT · BUILDING CONTROL NETWORK
        </text>
        <text x="540" y="595" textAnchor="end" className="font-mono" fontSize="9" letterSpacing="0.5" fill="var(--muted)">
          REV 0.1
        </text>
      </svg>

      {/* Module chips */}
      {modules.map((m, i) => {
        const top = CHIP.startY + i * CHIP.gapY;
        const Icon = m.icon;
        return (
          <div
            key={m.code}
            className="rise absolute flex items-center gap-2 rounded-lg border border-border bg-card/90 px-2.5 backdrop-blur"
            style={{
              left: pct(CHIP.x, VBW),
              top: pct(top, VBH),
              width: pct(CHIP.w, VBW),
              height: pct(CHIP.h, VBH),
              animationDelay: `${200 + i * 70}ms`,
            }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-weak text-primary">
              <Icon className="size-3.5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[11px] font-medium leading-tight">
                {m.name}
              </span>
              <span className="block font-mono text-[9px] leading-tight text-muted-foreground">
                {m.code}
              </span>
            </span>
            <span
              className="node-dot ml-auto size-1.5 shrink-0 rounded-full bg-success"
              style={{ animationDelay: `${i * 220}ms` }}
            />
          </div>
        );
      })}

      {/* CRM core — wrapper handles entrance, inner handles the glow loop */}
      <div
        className="rise absolute"
        style={{
          left: pct(CORE.x, VBW),
          top: pct(CORE.y, VBH),
          width: pct(CORE.w, VBW),
          height: pct(CORE.h, VBH),
          animationDelay: "120ms",
        }}
      >
        <div className="core-glow flex h-full w-full flex-col items-center justify-center rounded-xl border border-primary/40 bg-card/95 backdrop-blur">
          <ConduitMark className="size-6 text-primary" />
          <span className="mt-1.5 text-[13px] font-semibold tracking-tight">
            Conduit
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">
            CRM Core
          </span>
        </div>
      </div>
    </div>
  );
}
