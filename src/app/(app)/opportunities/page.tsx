import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PipelineBoard,
  type BoardCard,
} from "@/components/opportunities/pipeline-board";
import { formatAED } from "@/lib/format";
import { listOpportunitiesForBoard } from "@/modules/opportunities/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pipeline" };

export default async function OpportunitiesPage() {
  const ctx = await requireAuthContext();
  const rows = await listOpportunitiesForBoard(ctx);

  const cards: BoardCard[] = rows.map((r) => ({
    id: r.id,
    refNo: r.refNo,
    name: r.name,
    stage: r.stage,
    value: r.value,
    probability: r.probability,
    accountName: r.accountName,
  }));

  const open = rows.filter((r) => r.stage !== "won" && r.stage !== "lost");
  const openValue = open.reduce((a, r) => a + Number(r.value ?? 0), 0);
  const weighted = open.reduce(
    (a, r) => a + Number(r.value ?? 0) * (r.probability / 100),
    0,
  );
  const won = rows
    .filter((r) => r.stage === "won")
    .reduce((a, r) => a + Number(r.value ?? 0), 0);
  const canCreate = can(ctx, "opportunity.create");

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag opportunities across stages · {rows.length} live
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/opportunities/new">
              <Plus className="size-4" /> New opportunity
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-8 border-y border-border py-3">
        <Stat label="Open pipeline" value={formatAED(openValue, { compact: true })} />
        <Stat
          label="Weighted forecast"
          value={formatAED(weighted, { compact: true })}
        />
        <Stat label="Won" value={formatAED(won, { compact: true })} />
        <Stat label="Open opps" value={String(open.length)} />
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm font-medium">No opportunities yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one, or convert a qualified lead.
            </p>
          </div>
        ) : (
          <PipelineBoard initial={cards} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
