"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { saveLeadAction, type FormState } from "@/modules/leads/actions";
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/modules/leads/labels";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/modules/shared/project-types";
import type { Lead } from "@/db/schema";

type AccountOption = { id: string; name: string };

function toLocalDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function AccountSelect({
  name,
  options,
  value,
}: {
  name: string;
  options: AccountOption[];
  value?: string | null;
}) {
  return (
    <Select name={name} defaultValue={value ?? ""}>
      <option value="">— None —</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
  );
}

export function LeadForm({
  lead,
  accounts,
}: {
  lead?: Lead;
  accounts: AccountOption[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveLeadAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {lead && <input type="hidden" name="id" value={lead.id} />}
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Project / enquiry name"
          error={fe.projectName?.[0]}
          className="sm:col-span-2"
        >
          <Input
            name="projectName"
            defaultValue={lead?.projectName ?? ""}
            placeholder="e.g. Marina Gate — BMS upgrade"
            required
          />
        </Field>

        <Field label="Source">
          <Select name="source" defaultValue={lead?.source ?? "referral"}>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project type">
          <Select name="projectType" defaultValue={lead?.projectType ?? "bms"}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={lead?.status ?? "new"}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated value (AED)">
          <Input
            name="estValue"
            type="number"
            min="0"
            step="1000"
            defaultValue={lead?.estValue ?? ""}
          />
        </Field>

        <Field label="Customer account">
          <AccountSelect
            name="accountId"
            options={accounts}
            value={lead?.accountId}
          />
        </Field>
        <Field label="Consultant">
          <AccountSelect
            name="consultantId"
            options={accounts}
            value={lead?.consultantId}
          />
        </Field>
        <Field label="Contractor">
          <AccountSelect
            name="contractorId"
            options={accounts}
            value={lead?.contractorId}
          />
        </Field>
        <Field label="Project location">
          <Input
            name="projectLocation"
            defaultValue={lead?.projectLocation ?? ""}
          />
        </Field>
        <Field label="Next follow-up">
          <Input
            name="nextFollowUpAt"
            type="datetime-local"
            defaultValue={toLocalDateTime(lead?.nextFollowUpAt)}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" defaultValue={lead?.notes ?? ""} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : lead ? "Save changes" : "Create lead"}
      </Button>
    </form>
  );
}
