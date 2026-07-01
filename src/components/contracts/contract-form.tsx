"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  saveContractAction,
  type FormState,
} from "@/modules/contracts/actions";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  PPM_FREQUENCIES,
  PPM_FREQUENCY_LABELS,
} from "@/modules/contracts/labels";
import type { Contract } from "@/db/schema";

type Opt = { id: string; name: string };

export function ContractForm({
  contract,
  accounts,
}: {
  contract?: Contract;
  accounts: Opt[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveContractAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {contract && <input type="hidden" name="id" value={contract.id} />}
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contract title" error={fe.title?.[0]} className="sm:col-span-2">
          <Input
            name="title"
            defaultValue={contract?.title ?? ""}
            placeholder="e.g. AMC — DIFC Tower 2 BMS"
            required
          />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={contract?.type ?? "amc"}>
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTRACT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Customer">
          <Select name="accountId" defaultValue={contract?.accountId ?? ""}>
            <option value="">— None —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contract value (AED)">
          <Input
            name="value"
            type="number"
            min="0"
            step="1000"
            defaultValue={contract?.value ?? ""}
          />
        </Field>
        <Field label="Annual cost (AED)">
          <Input
            name="annualCost"
            type="number"
            min="0"
            step="1000"
            defaultValue={contract?.annualCost ?? ""}
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={contract?.status ?? "active"}>
            {CONTRACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTRACT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="PPM frequency">
          <Select name="ppmFrequency" defaultValue={contract?.ppmFrequency ?? ""}>
            <option value="">— None —</option>
            {PPM_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {PPM_FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input name="startDate" type="date" defaultValue={contract?.startDate ?? ""} />
        </Field>
        <Field label="End date">
          <Input name="endDate" type="date" defaultValue={contract?.endDate ?? ""} />
        </Field>
        <Field label="Renewal reminder">
          <Input
            name="renewalReminderAt"
            type="date"
            defaultValue={contract?.renewalReminderAt ?? ""}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" defaultValue={contract?.notes ?? ""} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : contract ? "Save changes" : "Create contract"}
      </Button>
    </form>
  );
}
