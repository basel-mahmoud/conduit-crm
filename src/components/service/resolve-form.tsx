"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import {
  resolveTicketAction,
  type FormState,
} from "@/modules/service/actions";

export function ResolveForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resolveTicketAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={ticketId} />
      <Field label="Resolution" error={state.fieldErrors?.resolution?.[0]}>
        <Textarea name="resolution" placeholder="What was done to resolve it…" required />
      </Field>
      <div className="flex items-end gap-3">
        <Field label="CSAT (1–5)">
          <Input name="csat" type="number" min="1" max="5" className="w-24" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Resolving…" : "Resolve ticket"}
        </Button>
      </div>
      {state.error && <p className="text-[11px] text-danger">{state.error}</p>}
    </form>
  );
}
