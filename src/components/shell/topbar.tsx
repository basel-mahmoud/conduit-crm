"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { ThemeToggle } from "@/components/theme-toggle";
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

export function Topbar() {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>

      <button className="ml-auto hidden h-9 w-64 items-center justify-between rounded-md px-3 text-sm text-muted-foreground ring-hairline transition-colors hover:text-foreground md:flex">
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          Search…
        </span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

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
    </header>
  );
}
