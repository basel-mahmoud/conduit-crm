"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";

interface SearchHit {
  label: string;
  sub: string;
  href: string;
}
interface SearchGroup {
  group: string;
  hits: SearchHit[];
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Remount the dialog every time it opens so all state starts fresh.
  if (!open) return null;
  return <PaletteDialog onClose={onClose} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  // Debounced fetch — all state updates happen inside the timer callback.
  useEffect(() => {
    const term = q.trim();
    const t = setTimeout(async () => {
      if (term.length < 2) {
        setGroups([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ac.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { groups: SearchGroup[] };
          setGroups(data.groups);
          setActive(0);
        }
      } catch {
        /* aborted or offline — keep previous results */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  // Keyboard navigation inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active].href);
    }
  };

  let idx = -1;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts, leads, quotations, projects, tickets…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {q.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">
              Type at least two characters — try a name, or a number like
              QT-2026-0001 or OPP-0003.
            </p>
          ) : flat.length === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">
              No matches for &ldquo;{q.trim()}&rdquo; in the modules you have
              access to.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.group} className="mb-1">
                <div className="px-3 pb-1 pt-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {g.group}
                </div>
                {g.hits.map((h) => {
                  idx += 1;
                  const i = idx;
                  return (
                    <button
                      key={h.href}
                      type="button"
                      onClick={() => go(h.href)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        i === active ? "bg-muted" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{h.label}</span>
                      <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                        {h.sub}
                      </span>
                      {i === active && (
                        <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
