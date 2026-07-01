"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav";
import { ConduitMark } from "./logo";

interface SidebarUser {
  name: string;
  roleName: string;
  initials: string;
}

export function Sidebar({
  user,
  allowedHrefs,
}: {
  user?: SidebarUser | null;
  /** Hrefs this user may see (computed server-side from their permissions). */
  allowedHrefs?: string[];
}) {
  const pathname = usePathname();
  const allowed = allowedHrefs ? new Set(allowedHrefs) : null;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <ConduitMark className="size-6 text-primary" />
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Conduit
        </span>
        <span className="ml-auto font-mono text-[10px] text-sidebar-muted">
          v0.1
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !allowed || allowed.has(item.href),
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-muted">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                        )}
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto size-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/guide"
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60"
          title="Your access level — open the guide"
        >
          <div className="grid size-7 place-items-center rounded-full bg-sidebar-accent font-mono text-[11px] text-white">
            {user?.initials ?? "—"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] text-white">
              {user?.name ?? "Not signed in"}
            </div>
            <div className="truncate font-mono text-[10px] text-primary">
              {user?.roleName ?? ""}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
