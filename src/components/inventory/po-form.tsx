"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { createPoAction, type FormState } from "@/modules/inventory/actions";

type Opt = { id: string; name: string };

export function PoForm({ suppliers }: { suppliers: Opt[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createPoAction,
    {},
  );
  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier">
          <Select name="supplierId" defaultValue="">
            <option value="">— None —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="hidden sm:block" />
        <Field label="Order date">
          <Input name="orderDate" type="date" />
        </Field>
        <Field label="Expected date">
          <Input name="expectedDate" type="date" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create purchase order"}
      </Button>
    </form>
  );
}
