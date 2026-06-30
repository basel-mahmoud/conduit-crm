import { requireAuthContext } from "@/server/auth/context";
import { can } from "@/server/rbac/guard";
import { ALL_PERMISSION_KEYS } from "@/server/rbac/permissions";
import { listRolesWithCounts, listUsersWithRoles } from "@/server/admin/queries";

export const metadata = { title: "Users & Roles" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "text-success"
      : status === "invited"
        ? "text-warning"
        : "text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default async function AdminPage() {
  const ctx = await requireAuthContext();

  if (!can(ctx, "user.manage") && !can(ctx, "role.manage")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to manage users and roles.
        </p>
      </div>
    );
  }

  const [people, roleList] = await Promise.all([
    listUsersWithRoles(ctx.orgId),
    listRolesWithCounts(ctx.orgId),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Users &amp; Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Identity, role assignments and the permission matrix for your
          organization.
        </p>
      </div>

      {/* People */}
      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">People</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {people.length} user{people.length === 1 ? "" : "s"}
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Roles</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
                    {p.email}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.roles.length ? (
                        p.roles.map((r) => (
                          <span
                            key={r}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px]"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Roles & permissions */}
      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Roles &amp; permissions</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {roleList.length} roles · {ALL_PERMISSION_KEYS.length} permissions
          </span>
        </header>
        <div className="divide-y divide-border">
          {roleList.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-44 shrink-0">
                <div className="text-[13px] font-medium">{r.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {r.key}
                </div>
              </div>
              <div className="hidden min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground sm:block">
                {r.description}
              </div>
              <div className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                {r.permissionCount} perms
              </div>
              {r.isSystem && (
                <span className="shrink-0 rounded bg-brand-weak px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                  system
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
