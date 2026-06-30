"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  addMilestoneAction,
  addSnagAction,
  updateSnagStatusAction,
  type FormState,
} from "@/modules/projects/actions";
import {
  SNAG_SEVERITIES,
  SNAG_STATUSES,
  SNAG_STATUS_LABELS,
  type SnagStatusKey,
} from "@/modules/projects/labels";

export function SnagStatusControl({
  snagId,
  projectId,
  status,
}: {
  snagId: string;
  projectId: string;
  status: SnagStatusKey;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form action={updateSnagStatusAction} ref={ref}>
      <input type="hidden" name="snagId" value={snagId} />
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => ref.current?.requestSubmit()}
        className="h-7 cursor-pointer rounded border border-input bg-card px-1.5 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      >
        {SNAG_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SNAG_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}

export function AddMilestoneForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addMilestoneAction,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Input
        name="title"
        placeholder="Add a milestone…"
        className="h-8 min-w-[180px] flex-1"
        required
      />
      <Input name="dueDate" type="date" className="h-8 w-40" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Plus className="size-3.5" /> Add
      </Button>
      {state.error && (
        <p className="w-full text-[11px] text-danger">{state.error}</p>
      )}
    </form>
  );
}

export function AddSnagForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addSnagAction,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Input
        name="title"
        placeholder="Log a snag / defect…"
        className="h-8 min-w-[180px] flex-1"
        required
      />
      <Select name="severity" defaultValue="medium" className="h-8 w-28">
        {SNAG_SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Input name="dueDate" type="date" className="h-8 w-40" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Plus className="size-3.5" /> Add snag
      </Button>
      {state.error && (
        <p className="w-full text-[11px] text-danger">{state.error}</p>
      )}
    </form>
  );
}
