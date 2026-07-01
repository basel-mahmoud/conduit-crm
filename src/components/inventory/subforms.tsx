"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  addPoLineAction,
  adjustStockAction,
  type FormState,
} from "@/modules/inventory/actions";
import {
  MOVEMENT_REASONS,
  MOVEMENT_REASON_LABELS,
} from "@/modules/inventory/labels";

export function AdjustStockForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    adjustStockAction,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="productId" value={productId} />
      <Input
        name="qtyDelta"
        type="number"
        placeholder="+10 / -5"
        className="h-8 w-24"
        required
      />
      <Select name="reason" defaultValue="purchase" className="h-8 w-36">
        {MOVEMENT_REASONS.map((r) => (
          <option key={r} value={r}>
            {MOVEMENT_REASON_LABELS[r]}
          </option>
        ))}
      </Select>
      <Input name="note" placeholder="Note" className="h-8 w-40" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Adjust stock
      </Button>
      {state.error && (
        <p className="w-full text-[11px] text-danger">{state.error}</p>
      )}
    </form>
  );
}

type ProductOpt = { id: string; sku: string; name: string };

export function AddPoLineForm({
  poId,
  products,
}: {
  poId: string;
  products: ProductOpt[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addPoLineAction,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="poId" value={poId} />
      <Select name="productId" defaultValue="" className="h-8 w-48">
        <option value="">— Free line —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.sku} · {p.name}
          </option>
        ))}
      </Select>
      <Input
        name="description"
        placeholder="Description"
        className="h-8 min-w-[160px] flex-1"
        required
      />
      <Input name="qty" type="number" min="1" defaultValue="1" className="h-8 w-20" />
      <Input
        name="unitCost"
        type="number"
        min="0"
        step="0.01"
        placeholder="Unit cost"
        className="h-8 w-28"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Plus className="size-3.5" /> Add line
      </Button>
      {state.error && (
        <p className="w-full text-[11px] text-danger">{state.error}</p>
      )}
    </form>
  );
}
