"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  createTicketAction,
  type FormState,
} from "@/modules/service/actions";
import {
  PRIORITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  TICKET_TYPE_LABELS,
} from "@/modules/service/labels";

type Opt = { id: string; name: string };
type ContractOpt = { id: string; number: string };

export function TicketForm({
  accounts,
  contracts,
}: {
  accounts: Opt[];
  contracts: ContractOpt[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createTicketAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Summary" error={fe.title?.[0]} className="sm:col-span-2">
          <Input
            name="title"
            placeholder="e.g. Chiller plant BMS offline — DIFC Tower 2"
            required
          />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue="breakdown">
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TICKET_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" hint="Sets the SLA response & resolution targets">
          <Select name="priority" defaultValue="p3">
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Customer">
          <Select name="accountId" defaultValue="">
            <option value="">— None —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contract">
          <Select name="contractId" defaultValue="">
            <option value="">— None —</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea name="description" placeholder="Fault details…" />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Logging…" : "Log ticket"}
      </Button>
    </form>
  );
}
