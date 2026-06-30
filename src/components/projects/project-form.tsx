"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { saveProjectAction, type FormState } from "@/modules/projects/actions";
import {
  HEALTHS,
  HEALTH_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "@/modules/projects/labels";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/modules/shared/project-types";
import type { Project } from "@/db/schema";

type AccountOption = { id: string; name: string };

export function ProjectForm({
  project,
  accounts,
}: {
  project?: Project;
  accounts: AccountOption[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProjectAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="pmId" value={project?.pmId ?? ""} />
      <input
        type="hidden"
        name="siteEngineerId"
        value={project?.siteEngineerId ?? ""}
      />
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" error={fe.name?.[0]} className="sm:col-span-2">
          <Input name="name" defaultValue={project?.name ?? ""} required />
        </Field>
        <Field label="Customer">
          <Select name="accountId" defaultValue={project?.accountId ?? ""}>
            <option value="">— None —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project type">
          <Select name="projectType" defaultValue={project?.projectType ?? "bms"}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contract value (AED)">
          <Input
            name="contractValue"
            type="number"
            min="0"
            step="1000"
            defaultValue={project?.contractValue ?? ""}
          />
        </Field>
        <Field label="Location">
          <Input name="location" defaultValue={project?.location ?? ""} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={project?.status ?? "registered"}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Health">
          <Select name="health" defaultValue={project?.health ?? "on_track"}>
            {HEALTHS.map((h) => (
              <option key={h} value={h}>
                {HEALTH_LABELS[h]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input
            name="startDate"
            type="date"
            defaultValue={project?.startDate ?? ""}
          />
        </Field>
        <Field label="Target end date">
          <Input
            name="targetEndDate"
            type="date"
            defaultValue={project?.targetEndDate ?? ""}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" defaultValue={project?.notes ?? ""} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
