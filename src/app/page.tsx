import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConduitMark } from "@/components/shell/logo";
import { ControlSchematic } from "@/components/marketing/control-schematic";

const lifecycle: { group: string; rows: { name: string; spec: string }[] }[] = [
  {
    group: "Sell",
    rows: [
      { name: "Leads & enquiries", spec: "source · consultant · contractor" },
      { name: "Opportunity pipeline", spec: "9 stages · weighted forecast" },
      { name: "Technical quotations", spec: "BOQ · cost build-up · margin" },
    ],
  },
  {
    group: "Deliver",
    rows: [
      { name: "Project execution", spec: "milestones · variations" },
      { name: "Procurement & engineering", spec: "submittals · drawings" },
      { name: "T&C, snags & handover", spec: "status · sign-off" },
    ],
  },
  {
    group: "Service",
    rows: [
      { name: "AMC & PPM contracts", spec: "renewals · profitability" },
      { name: "SLA-tracked tickets", spec: "dispatch · response · resolve" },
      { name: "Assets & service reports", spec: "registry · signatures" },
    ],
  },
];

const moduleIndex = [
  ["BMS", "Building Mgmt"],
  ["LCS", "Lighting Control"],
  ["HA", "Home Automation"],
  ["EMS", "Energy Mgmt"],
  ["BTU", "BTU Metering"],
  ["HVAC", "HVAC Controls"],
  ["ELV", "Extra-Low Voltage"],
  ["TRD", "Trading"],
  ["CON", "Contracting"],
  ["AMC", "Annual Maintenance"],
  ["PPM", "Planned PM"],
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Title block / nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
          <ConduitMark className="size-6 text-primary" />
          <span className="text-[15px] font-semibold tracking-tight">
            Conduit
          </span>
          <span className="ml-3 hidden border-l border-border pl-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Systems Integration · CRM
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/dashboard">
                Open app
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:py-24">
          <div>
            <p className="rise flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span className="node-dot inline-block size-1.5 rounded-full bg-success" />
              System online · 11 modules connected
            </p>

            <h1
              className="rise mt-5 text-balance text-[clamp(2.4rem,5.4vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
              style={{ animationDelay: "60ms" }}
            >
              Wire your business the way you wire a{" "}
              <span className="text-primary">building.</span>
            </h1>

            <p
              className="rise mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--ink-2)] sm:text-base"
              style={{ animationDelay: "120ms" }}
            >
              Conduit is the control layer for systems integrators — capturing
              leads, building technical quotations, running project delivery,
              and keeping AMC, PPM and service on schedule. One connected system
              from first enquiry to final commissioning.
            </p>

            <div
              className="rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open the command center
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">See the live dashboard</Link>
              </Button>
            </div>

            <dl
              className="rise mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6"
              style={{ animationDelay: "240ms" }}
            >
              {[
                ["AED 32.8M", "open pipeline"],
                ["61", "live AMC / PPM"],
                ["31%", "quotation win-rate"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-lg font-semibold tabular-nums">
                    {v}
                  </dt>
                  <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise" style={{ animationDelay: "120ms" }}>
            <ControlSchematic />
          </div>
        </section>

        {/* Lifecycle datasheet */}
        <section className="grid gap-10 border-t border-border py-16 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One system. The entire lifecycle.
            </h2>
            <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
              No more a spreadsheet per stage. Conduit models how integration
              and contracting businesses actually run — sell, deliver, service —
              with the documents, approvals and numbers each stage demands.
            </p>
          </div>

          <div>
            {lifecycle.map((g) => (
              <div
                key={g.group}
                className="grid grid-cols-[88px_1fr] gap-4 border-t border-border py-6 first:border-t-0 first:pt-0 sm:grid-cols-[120px_1fr]"
              >
                <div className="pt-0.5 font-mono text-xs uppercase tracking-[0.16em] text-primary">
                  {g.group}
                </div>
                <ul className="space-y-3">
                  {g.rows.map((r) => (
                    <li
                      key={r.name}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                    >
                      <span className="text-[15px] font-medium">{r.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {r.spec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Module index / drawing legend */}
        <section className="border-t border-border py-12">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Module index
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              11 / 11
            </span>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
            {moduleIndex.map(([code, name]) => (
              <div
                key={code}
                className="flex items-center gap-3 bg-background px-4 py-3"
              >
                <span className="w-12 shrink-0 font-mono text-[12px] font-semibold tabular-nums text-primary">
                  {code}
                </span>
                <span className="truncate text-[13px] text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Console close */}
        <section className="border-t border-border py-20">
          <div className="overflow-hidden rounded-2xl border border-border bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-1.5 border-b border-sidebar-border px-5 py-3">
              <span className="size-2.5 rounded-full bg-danger/80" />
              <span className="size-2.5 rounded-full bg-warning/80" />
              <span className="size-2.5 rounded-full bg-success/80" />
              <span className="ml-3 font-mono text-[11px] text-sidebar-muted">
                conduit — session
              </span>
            </div>
            <div className="px-6 py-12 sm:px-12 sm:py-16">
              <p className="font-mono text-[13px] text-success">
                conduit ▸ ready
                <span className="node-dot ml-1 inline-block h-4 w-[7px] translate-y-[3px] bg-success" />
              </p>
              <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Step into the command center.
              </h2>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-sidebar-muted">
                Your whole operation — sales, delivery and service — on one line.
              </p>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Open Conduit
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer title block */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-warning">Demonstration build.</span>{" "}
            All companies, people, figures and documents shown are fictional
            sample data for evaluation only — not real, and not for making
            business decisions. See the{" "}
            <Link
              href="/legal"
              className="underline underline-offset-2 hover:text-foreground"
            >
              disclaimer &amp; terms of use
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} Conduit CRM</span>
            <span className="hidden sm:inline">
              Neon · Clerk · Next.js · Vercel
            </span>
            <Link href="/legal" className="hover:text-foreground">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
