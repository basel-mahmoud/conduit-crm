"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

import {
  updateOrgSettingsAction,
  type OrgSettingsState,
} from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function OrgNameForm({
  defaultName,
  canEdit,
}: {
  defaultName: string;
  canEdit: boolean;
}) {
  const [state, action] = useActionState<OrgSettingsState, FormData>(
    updateOrgSettingsAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2 sm:max-w-md">
      <label
        htmlFor="org-name"
        className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
      >
        Organization name
      </label>
      <div className="flex items-center gap-2">
        <input
          id="org-name"
          name="name"
          defaultValue={defaultName}
          disabled={!canEdit}
          className="h-9 flex-1 rounded-md bg-muted/40 px-3 text-sm ring-hairline outline-none transition-colors focus:ring-1 focus:ring-primary disabled:opacity-60"
        />
        {canEdit && <SaveButton />}
      </div>
      {state.fieldErrors?.name && (
        <p className="text-[12px] text-danger">{state.fieldErrors.name}</p>
      )}
      {state.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state.ok && (
        <p className="inline-flex items-center gap-1.5 text-[12px] text-success">
          <Check className="size-3.5" /> Saved.
        </p>
      )}
      {!canEdit && (
        <p className="text-[12px] text-muted-foreground">
          Only administrators can change organization settings.
        </p>
      )}
    </form>
  );
}
