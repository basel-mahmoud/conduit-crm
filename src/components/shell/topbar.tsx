"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/shell/command-palette";
import { navGroups } from "@/lib/nav";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function usePageTitle() {
  const pathname = usePathname();
  const all = navGroups.flatMap((g) => g.items);
  const match = all.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  return match?.label ?? "Dashboard";
}

export function Topbar({
  roleName,
  minimal,
}: {
  /** Current user's primary role — the always-visible access indicator. */
  roleName?: string;
  /** Render only the account control (used on the pending-access screen). */
  minimal?: boolean;
}) {
  const title = usePageTitle();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (minimal) {
    return clerkEnabled ? (
      <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
    ) : null;
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto hidden h-9 w-64 items-center justify-between rounded-md px-3 text-sm text-muted-foreground ring-hairline transition-colors hover:text-foreground md:flex"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          Search…
        </span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search trigger */}
      <button
        type="button"
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
        className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Search className="size-4" />
      </button>

      {roleName && (
        <Link
          href="/guide"
          title="Your access level — open the guide"
          className="hidden items-center gap-1.5 rounded-full bg-brand-weak px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary transition-opacity hover:opacity-80 sm:inline-flex"
        >
          <ShieldCheck className="size-3" />
          {roleName}
        </Link>
      )}

      <button
        aria-label="Notifications"
        className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
      </button>

      <ThemeToggle />

      {clerkEnabled && (
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      )}

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
