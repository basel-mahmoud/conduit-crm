"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  sub: string;
  href: string;
}

const TONE_DOT: Record<Notification["tone"], string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
};

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { items: Notification[] };
        setItems(data.items);
      }
    } catch {
      /* ignore — leave previous items */
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount (badge) and whenever the menu is opened. Deferred to a timer
  // so state updates don't run synchronously inside the effect.
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [open, load]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = items?.length ?? 0;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-danger px-1 text-[9px] font-semibold leading-[15px] text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-[13px] font-semibold">Notifications</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                `${count} active`
              )}
            </span>
          </header>

          <div className="max-h-[60vh] overflow-y-auto">
            {items === null && loading ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Loading…
              </p>
            ) : count === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                You&rsquo;re all caught up — no alerts for your role right now.
              </p>
            ) : (
              items!.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => go(n.href)}
                  className="flex w-full items-start gap-2.5 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50"
                >
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${TONE_DOT[n.tone]}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">
                      {n.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {n.sub}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <footer className="border-t border-border px-4 py-2 text-center">
            <span className="font-mono text-[10px] text-muted-foreground">
              Live alerts from your accessible modules
            </span>
          </footer>
        </div>
      )}
    </div>
  );
}
