"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { setUserRolesAction, type SetRolesState } from "./actions";

interface RoleOption {
  key: string;
  name: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save access"}
    </button>
  );
}

export function RoleEditor({
  userId,
  current,
  options,
}: {
  userId: string;
  current: string[];
  options: RoleOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SetRolesState, FormData>(
    setUserRolesAction,
    {},
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close after a successful save.
  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => setOpen(false), 700);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-primary ring-hairline transition-colors hover:bg-brand-weak"
      >
        Edit access <ChevronDown className="size-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-lg border border-border bg-card p-3 shadow-xl">
          <form action={action} className="space-y-2">
            <input type="hidden" name="userId" value={userId} />
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {options.map((r) => (
                <label
                  key={r.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12.5px] hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={r.key}
                    defaultChecked={current.includes(r.key)}
                    className="size-3.5 accent-[var(--brand)]"
                  />
                  {r.name}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              {state.ok ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-success">
                  <Check className="size-3.5" /> Saved
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {current.length ? `${current.length} assigned` : "No access"}
                </span>
              )}
              <SaveButton />
            </div>
            {state.error && (
              <p className="text-[11.5px] leading-snug text-danger">
                {state.error}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
