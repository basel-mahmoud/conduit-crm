import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HealthBadge, ProjectStatusBadge } from "@/components/projects/badges";
import { formatAED } from "@/lib/format";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatusKey,
} from "@/modules/projects/labels";
import { listProjects } from "@/modules/projects/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthContext();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = (PROJECT_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as ProjectStatusKey)
    : undefined;
  const rows = await listProjects(ctx, { q, status });
  const canCreate = can(ctx, "project.create");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Awarded projects in execution — phases, milestones and snags.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" /> New project
            </Link>
          </Button>
        )}
      </div>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/projects">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search projects…"
            className="h-9 w-64 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip active={!status} href={q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"}>
          All
        </Chip>
        {PROJECT_STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={`/projects?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            {PROJECT_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Win a quotation and choose{" "}
              <span className="font-medium">Register project</span>, or create one
              directly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 text-right font-medium">Contract</th>
                  <th className="px-4 py-2.5 font-medium">Progress</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {p.code}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {p.accountName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatAED(p.contractValue)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-[var(--brand)]"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProjectStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge health={p.health} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {rows.length} project{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
        active
          ? "border-primary bg-brand-weak text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
