"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  addAssetAction,
  scheduleVisitAction,
  type FormState,
} from "@/modules/contracts/actions";
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
} from "@/modules/contracts/labels";

export function AddAssetForm({ contractId }: { contractId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addAssetAction,
    {},
  );
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="contractId" value={contractId} />
      <Input name="name" placeholder="Asset name / tag" className="h-8" required />
      <Select name="category" defaultValue="controller" className="h-8">
        {ASSET_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {ASSET_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
      <Input name="manufacturer" placeholder="Manufacturer" className="h-8" />
      <Input name="model" placeholder="Model" className="h-8" />
      <Input name="serialNo" placeholder="Serial no." className="h-8" />
      <Input name="location" placeholder="Location" className="h-8" />
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          <Plus className="size-3.5" /> Add asset
        </Button>
        {state.error && (
          <span className="ml-2 text-[11px] text-danger">{state.error}</span>
        )}
      </div>
    </form>
  );
}

export function ScheduleVisitForm({ contractId }: { contractId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    scheduleVisitAction,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <Input name="scheduledDate" type="date" className="h-8 w-44" required />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Plus className="size-3.5" /> Schedule visit
      </Button>
      {state.error && (
        <span className="text-[11px] text-danger">{state.error}</span>
      )}
    </form>
  );
}
