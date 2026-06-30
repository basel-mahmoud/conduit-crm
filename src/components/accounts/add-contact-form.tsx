"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { addContactAction, type FormState } from "@/modules/accounts/actions";

export function AddContactForm({ accountId }: { accountId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addContactAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="accountId" value={accountId} />
      {state.error && <p className="text-[11px] text-danger">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" error={fe.firstName?.[0]}>
          <Input name="firstName" required />
        </Field>
        <Field label="Last name">
          <Input name="lastName" />
        </Field>
        <Field label="Title">
          <Input name="title" placeholder="e.g. MEP Manager" />
        </Field>
        <Field label="Email" error={fe.email?.[0]}>
          <Input name="email" type="email" />
        </Field>
        <Field label="Phone">
          <Input name="phone" />
        </Field>
        <Field label="Mobile">
          <Input name="mobile" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <input
          type="checkbox"
          name="isPrimary"
          className="size-3.5 rounded border-input accent-[var(--brand)]"
        />
        Primary contact
      </label>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add contact"}
      </Button>
    </form>
  );
}
