import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { PendingAccess } from "@/components/shell/pending-access";
import { DemoBanner } from "@/components/legal/demo-banner";
import { navGroups } from "@/lib/nav";
import {
  getAuthContext,
  getCurrentUserDisplay,
  clerkEnabled,
} from "@/server/auth/context";
import { can } from "@/server/rbac/guard";
import type { PermissionKey } from "@/server/rbac/permissions";

// Authenticated shell renders per-request (reads identity + DB).
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [ctx, user] = await Promise.all([
    getAuthContext(),
    getCurrentUserDisplay(),
  ]);

  // Signed in but no roles yet (fresh sign-up): show the pending screen
  // instead of a workspace where every module errors.
  if (ctx && ctx.roleKeys.length === 0) {
    return (
      <>
        <DemoBanner />
        <PendingAccess name={user?.name ?? "there"} email={user?.email ?? ""} />
        {clerkEnabled && (
          <div className="fixed right-4 top-4">
            <Topbar minimal roleName="No access" />
          </div>
        )}
      </>
    );
  }

  // Server-side nav filtering: only show modules this user can actually open.
  const allowedHrefs = navGroups
    .flatMap((g) => g.items)
    .filter(
      (i) => !i.permission || (ctx && can(ctx, i.permission as PermissionKey)),
    )
    .map((i) => i.href);

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar user={user} allowedHrefs={allowedHrefs} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar roleName={user?.roleName ?? "Member"} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
