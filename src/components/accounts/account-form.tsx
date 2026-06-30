"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { saveAccountAction, type FormState } from "@/modules/accounts/actions";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  RATINGS,
  RATING_LABELS,
} from "@/modules/accounts/labels";
import type { Account } from "@/db/schema";

export function AccountForm({ account }: { account?: Account }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveAccountAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {account && <input type="hidden" name="id" value={account.id} />}
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Account name"
          error={fe.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            name="name"
            defaultValue={account?.name ?? ""}
            placeholder="e.g. Emaar Properties"
            required
          />
        </Field>

        <Field label="Type">
          <Select name="type" defaultValue={account?.type ?? "end_user"}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Rating">
          <Select name="rating" defaultValue={account?.rating ?? "b"}>
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {RATING_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Email" error={fe.email?.[0]}>
          <Input
            name="email"
            type="email"
            defaultValue={account?.email ?? ""}
            placeholder="info@company.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            name="phone"
            defaultValue={account?.phone ?? ""}
            placeholder="+971 4 000 0000"
          />
        </Field>
        <Field label="Industry">
          <Input name="industry" defaultValue={account?.industry ?? ""} />
        </Field>
        <Field label="Website">
          <Input
            name="website"
            defaultValue={account?.website ?? ""}
            placeholder="company.com"
          />
        </Field>
        <Field label="Trade licence">
          <Input name="tradeLicense" defaultValue={account?.tradeLicense ?? ""} />
        </Field>
        <Field label="VAT no.">
          <Input name="vatNo" defaultValue={account?.vatNo ?? ""} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input name="addressLine" defaultValue={account?.addressLine ?? ""} />
        </Field>
        <Field label="City">
          <Input name="city" defaultValue={account?.city ?? ""} />
        </Field>
        <Field label="Country">
          <Input
            name="country"
            defaultValue={account?.country ?? "United Arab Emirates"}
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={account?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" defaultValue={account?.notes ?? ""} />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : account ? "Save changes" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
