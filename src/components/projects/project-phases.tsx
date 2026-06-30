"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { savePhasesAction } from "@/modules/projects/actions";
import {
  PHASE_LABELS,
  PHASE_STATUSES,
  PHASE_STATUS_LABELS,
  type PhaseKindKey,
  type PhaseStatusKey,
} from "@/modules/projects/labels";

interface PhaseRow {
  id: string;
  kind: PhaseKindKey;
  status: PhaseStatusKey;
  progressPct: number;
}

const barTone: Record<PhaseStatusKey, string> = {
  not_started: "bg-muted-foreground/30",
  in_progress: "bg-[var(--brand)]",
  completed: "bg-success",
  blocked: "bg-danger",
};

export function ProjectPhases({
  projectId,
  initial,
  editable,
}: {
  projectId: string;
  initial: PhaseRow[];
  editable: boolean;
}) {
  const router = useRouter();
  const [phases, setPhases] = useState(initial);
  const [saving, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const setStatus = (i: number, status: PhaseStatusKey) =>
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              status,
              progressPct:
                status === "completed"
                  ? 100
                  : status === "not_started"
                    ? 0
                    : p.progressPct,
            }
          : p,
      ),
    );

  const setProgress = (i: number, v: string) => {
    const num = Math.max(0, Math.min(100, Number(v) || 0));
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              progressPct: num,
              status:
                num === 100
                  ? "completed"
                  : num > 0 && p.status === "not_started"
                    ? "in_progress"
                    : p.status,
            }
          : p,
      ),
    );
  };

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await savePhasesAction(
        projectId,
        phases.map((p) => ({
          id: p.id,
          status: p.status,
          progressPct: p.progressPct,
        })),
      );
      if (r.ok) {
        setMsg("Saved");
        router.refresh();
      } else {
        setMsg(r.error ?? "Save failed");
      }
    });
  };

  const overall = phases.length
    ? Math.round(phases.reduce((a, p) => a + p.progressPct, 0) / phases.length)
    : 0;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Execution phases</h3>
        <span className="font-mono text-[12px] text-muted-foreground">
          {overall}% overall
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {phases.map((p, i) => (
          <div key={p.id} className="grid grid-cols-[160px_1fr_auto] items-center gap-3">
            <div className="text-[13px] font-medium">{PHASE_LABELS[p.kind]}</div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${barTone[p.status]}`}
                style={{ width: `${p.progressPct}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              {editable ? (
                <>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={p.progressPct}
                    onChange={(e) => setProgress(i, e.target.value)}
                    className="h-7 w-14 rounded border border-input bg-card px-1.5 text-right font-mono text-[12px] tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                  />
                  <select
                    value={p.status}
                    onChange={(e) =>
                      setStatus(i, e.target.value as PhaseStatusKey)
                    }
                    className="h-7 w-32 cursor-pointer rounded border border-input bg-card px-1.5 text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                  >
                    {PHASE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {PHASE_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <span className="w-44 text-right font-mono text-[12px] text-muted-foreground">
                  {p.progressPct}% · {PHASE_STATUS_LABELS[p.status]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {editable && (
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? (
              "Saving…"
            ) : msg === "Saved" ? (
              <>
                <Check className="size-4" /> Saved
              </>
            ) : (
              <>
                <Save className="size-4" /> Save phases
              </>
            )}
          </Button>
          {msg && msg !== "Saved" && (
            <span className="text-[12px] text-danger">{msg}</span>
          )}
        </div>
      )}
    </section>
  );
}
