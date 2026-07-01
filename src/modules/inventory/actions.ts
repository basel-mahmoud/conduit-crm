"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import {
  adjustStockSchema,
  poInputSchema,
  poLineInputSchema,
  productInputSchema,
} from "./schema";
import {
  addPoLine,
  adjustStock,
  createProduct,
  createPurchaseOrder,
  receivePurchaseOrder,
  setPoStatus,
  softDeleteProduct,
  softDeletePurchaseOrder,
  updateProduct,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function saveProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());
  const parsed = productInputSchema.safeParse({
    ...raw,
    category: raw.category || "controller",
    status: raw.status || "active",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  let pid: string;
  try {
    pid = id
      ? (await updateProduct(ctx, id, parsed.data)).id
      : (await createProduct(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "SKU may already exist." };
  }
  revalidatePath("/inventory");
  redirect(`/inventory/${pid}`);
}

export async function deleteProductAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteProduct(ctx, formData.get("id") as string);
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function adjustStockAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const productId = formData.get("productId") as string;
  const parsed = adjustStockSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    reason: formData.get("reason") || "adjustment",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.qtyDelta?.[0] ?? "Invalid input.",
    };
  }
  try {
    await adjustStock(ctx, productId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/inventory/${productId}`);
  return {};
}

export async function createPoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const parsed = poInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Invalid input." };
  let pid: string;
  try {
    pid = (await createPurchaseOrder(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/inventory/po");
  redirect(`/inventory/po/${pid}`);
}

export async function addPoLineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const poId = formData.get("poId") as string;
  const parsed = poLineInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await addPoLine(ctx, poId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/inventory/po/${poId}`);
  return {};
}

export async function receivePoAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  await receivePurchaseOrder(ctx, id);
  revalidatePath(`/inventory/po/${id}`);
  revalidatePath("/inventory");
}

export async function setPoStatusAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (["draft", "ordered", "received", "cancelled"].includes(status)) {
    await setPoStatus(ctx, id, status as "ordered");
  }
  revalidatePath(`/inventory/po/${id}`);
}

export async function deletePoAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeletePurchaseOrder(ctx, formData.get("id") as string);
  revalidatePath("/inventory/po");
  redirect("/inventory/po");
}
