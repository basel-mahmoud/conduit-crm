"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { saveProductAction, type FormState } from "@/modules/inventory/actions";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUSES,
  PRODUCT_UNITS,
} from "@/modules/inventory/labels";
import type { Product } from "@/db/schema";

export function ProductForm({
  product,
  manufacturerName,
}: {
  product?: Product;
  manufacturerName?: string | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProductAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU / part no." error={fe.sku?.[0]}>
          <Input name="sku" defaultValue={product?.sku ?? ""} required />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue={product?.category ?? "controller"}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PRODUCT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Name" error={fe.name?.[0]} className="sm:col-span-2">
          <Input name="name" defaultValue={product?.name ?? ""} required />
        </Field>
        <Field label="Manufacturer">
          <Input
            name="manufacturerName"
            defaultValue={manufacturerName ?? ""}
            placeholder="e.g. Schneider Electric"
          />
        </Field>
        <Field label="Model no.">
          <Input name="modelNo" defaultValue={product?.modelNo ?? ""} />
        </Field>
        <Field label="Cost (AED)">
          <Input
            name="cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.cost ?? ""}
          />
        </Field>
        <Field label="Sell price (AED)">
          <Input
            name="sellPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.sellPrice ?? ""}
          />
        </Field>
        <Field label="Unit">
          <Select name="unit" defaultValue={product?.unit ?? "nos"}>
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lead time (days)">
          <Input
            name="leadTimeDays"
            type="number"
            min="0"
            defaultValue={product?.leadTimeDays ?? ""}
          />
        </Field>
        <Field label="Reorder level">
          <Input
            name="reorderLevel"
            type="number"
            min="0"
            defaultValue={product?.reorderLevel ?? 0}
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={product?.status ?? "active"}>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Datasheet URL" className="sm:col-span-2">
          <Input name="datasheetUrl" defaultValue={product?.datasheetUrl ?? ""} />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : product ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
