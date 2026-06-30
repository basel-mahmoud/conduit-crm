"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  saveOpportunityAction,
  type FormState,
} from "@/modules/opportunities/actions";
import {
  APPROVALS,
  APPROVAL_LABELS,
  OPP_STAGES,
  STAGE_META,
} from "@/modules/opportunities/labels";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/modules/shared/project-types";
import type { Opportunity } from "@/db/schema";

type AccountOption = { id: string; name: string };

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

export function OpportunityForm({
  opportunity,
  accounts,
}: {
  opportunity?: Opportunity;
  accounts: AccountOption[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveOpportunityAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {opportunity && <input type="hidden" name="id" value={opportunity.id} />}
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Opportunity name"
          error={fe.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            name="name"
            defaultValue={opportunity?.name ?? ""}
            placeholder="e.g. DIFC Tower 2 — BMS & HVAC controls"
            required
          />
        </Field>

        <Field label="Customer account">
          <AccountSelect
            name="accountId"
            options={accounts}
            value={opportunity?.accountId}
          />
        </Field>
        <Field label="Project type">
          <Select
            name="projectType"
            defaultValue={opportunity?.projectType ?? "bms"}
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Stage">
          <Select name="stage" defaultValue={opportunity?.stage ?? "new"}>
            {OPP_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Probability %" hint="Leave blank to use the stage default">
          <Input
            name="probability"
            type="number"
            min="0"
            max="100"
            defaultValue={opportunity?.probability ?? ""}
          />
        </Field>

        <Field label="Value (AED)">
          <Input
            name="value"
            type="number"
            min="0"
            step="1000"
            defaultValue={opportunity?.value ?? ""}
          />
        </Field>
        <Field label="Expected close">
          <Input
            name="expectedCloseDate"
            type="date"
            defaultValue={opportunity?.expectedCloseDate ?? ""}
          />
        </Field>

        <Field label="Consultant approval">
          <Select
            name="consultantApproval"
            defaultValue={opportunity?.consultantApproval ?? "na"}
          >
            {APPROVALS.map((a) => (
              <option key={a} value={a}>
                {APPROVAL_LABELS[a]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contractor approval">
          <Select
            name="contractorApproval"
            defaultValue={opportunity?.contractorApproval ?? "na"}
          >
            {APPROVALS.map((a) => (
              <option key={a} value={a}>
                {APPROVAL_LABELS[a]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Main competitor" className="sm:col-span-2">
          <Input
            name="competitor"
            defaultValue={opportunity?.competitor ?? ""}
            placeholder="e.g. Siemens, Johnson Controls"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" defaultValue={opportunity?.notes ?? ""} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : opportunity
            ? "Save changes"
            : "Create opportunity"}
      </Button>
    </form>
  );
}
