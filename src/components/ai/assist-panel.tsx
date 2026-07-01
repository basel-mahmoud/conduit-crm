"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  leadAssistAction,
  opportunityAssistAction,
} from "@/modules/ai/actions";
import type { LeadAssist, OppAssist } from "@/modules/ai/assist";

type Result = OppAssist | LeadAssist;

export function AiAssistPanel({
  kind,
  id,
}: {
  kind: "opportunity" | "lead";
  id: string;
}) {
  const [data, setData] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = () => {
    setErr(null);
    start(async () => {
      const r =
        kind === "opportunity"
          ? await opportunityAssistAction(id)
          : await leadAssistAction(id);
      if ("error" in r) setErr(r.error);
      else {
        setData(r);
        setCopied(false);
      }
    });
  };

  const copy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isOpp = data != null && "score" in data;

  return (
    <section className="rounded-lg border border-primary/25 bg-brand-weak/30 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" /> AI assist
        </h3>
        {data && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {data.source === "gemini" ? "Gemini" : "heuristic"}
          </span>
        )}
      </div>

      {!data ? (
        <div className="mt-3">
          <p className="text-[12.5px] text-muted-foreground">
            Generate a suggested next step and a draft{" "}
            {kind === "opportunity" ? "follow-up" : "outreach"} email from this
            record.
          </p>
          <Button onClick={run} disabled={pending} size="sm" className="mt-3">
            {pending ? (
              "Analysing…"
            ) : (
              <>
                <Sparkles className="size-3.5" /> Generate
              </>
            )}
          </Button>
          {err && <p className="mt-2 text-[11px] text-danger">{err}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {isOpp && (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums">
                {(data as OppAssist).score}
              </span>
              <span className="text-[11px] text-muted-foreground">
                / 100 health score
              </span>
            </div>
          )}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {isOpp ? "Assessment" : "Recommendation"}
            </div>
            <p className="mt-0.5 text-[13px] leading-snug">
              {isOpp
                ? (data as OppAssist).rationale
                : (data as LeadAssist).recommendation}
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Next action
            </div>
            <p className="mt-0.5 text-[13px] font-medium">{data.nextAction}</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Draft email
              </div>
              <button
                onClick={copy}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="size-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={data.email}
              className="mt-1 h-40 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-[12.5px] outline-none"
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <button
              onClick={run}
              disabled={pending}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3.5" /> {pending ? "…" : "Regenerate"}
            </button>
            <span className="text-[10px] text-muted-foreground">
              Suggestion — review before sending
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
