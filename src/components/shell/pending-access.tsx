import { ShieldAlert } from "lucide-react";

/**
 * Shown instead of the app when a signed-in user has no roles yet.
 * New sign-ups land here until an administrator assigns their access level
 * in Users & Roles — this replaces the raw permission errors they used to hit.
 */
export function PendingAccess({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-weak">
          <ShieldAlert className="size-6 text-primary" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Access pending
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Your account isn&rsquo;t activated yet
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You&rsquo;re signed in as <span className="text-foreground">{name}</span>{" "}
          (<span className="font-mono text-[12.5px]">{email}</span>), but no
          access level has been assigned to this account. An administrator can
          activate you from <span className="text-foreground">Admin → Users &amp;
          Roles</span> by picking your role — Sales, Projects, Service,
          Procurement, Accounts, or full Administrator.
        </p>
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          Once a role is assigned, refresh this page and the workspace unlocks
          automatically. Use the account menu (top right) to sign out.
        </p>
      </div>
    </main>
  );
}
