"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { formatAED } from "@/lib/format";
import { moveStageAction } from "@/modules/opportunities/actions";
import {
  PIPELINE_COLUMNS,
  STAGE_META,
  type OppStageKey,
} from "@/modules/opportunities/labels";

export interface BoardCard {
  id: string;
  refNo: string;
  name: string;
  stage: OppStageKey;
  value: string | null;
  probability: number;
  accountName: string | null;
}

export function PipelineBoard({ initial }: { initial: BoardCard[] }) {
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<OppStageKey | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(stage: OppStageKey) {
    const id = dragId;
    setDragId(null);
    setOverStage(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;

    const prevStage = card.stage;
    const prevProbability = card.probability;
    // Optimistic move.
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, stage, probability: STAGE_META[stage].probability }
          : c,
      ),
    );
    startTransition(async () => {
      const res = await moveStageAction(id, stage);
      if (!res.ok) {
        // Roll back on failure.
        setCards((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, stage: prevStage, probability: prevProbability }
              : c,
          ),
        );
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map((stage) => {
        const colCards = cards.filter((c) => c.stage === stage);
        const sum = colCards.reduce((a, c) => a + Number(c.value ?? 0), 0);
        const isOver = overStage === stage;
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() =>
              setOverStage((s) => (s === stage ? null : s))
            }
            onDrop={() => handleDrop(stage)}
            className={`flex w-72 shrink-0 flex-col rounded-lg border transition-colors ${
              isOver ? "border-primary bg-brand-weak/40" : "border-border bg-card/30"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: STAGE_META[stage].color }}
                />
                <span className="text-[12px] font-semibold">
                  {STAGE_META[stage].label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {colCards.length}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatAED(sum, { compact: true })}
              </span>
            </div>

            <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
              {colCards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => setDragId(card.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  className={`group cursor-grab rounded-md border border-border bg-card p-2.5 transition-shadow hover:shadow-[var(--shadow-md)] active:cursor-grabbing ${
                    dragId === card.id ? "opacity-50" : ""
                  }`}
                >
                  <Link href={`/opportunities/${card.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {card.refNo}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {card.probability}%
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug group-hover:text-primary">
                      {card.name}
                    </div>
                    {card.accountName && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {card.accountName}
                      </div>
                    )}
                    <div className="mt-2 font-mono text-[12px] font-semibold tabular-nums">
                      {formatAED(card.value)}
                    </div>
                  </Link>
                </div>
              ))}
              {colCards.length === 0 && (
                <div className="grid h-16 place-items-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
