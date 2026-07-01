"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import {
  assetInputSchema,
  contractInputSchema,
  visitInputSchema,
} from "./schema";
import {
  addAsset,
  completeVisit,
  createContract,
  createContractFromProject,
  scheduleVisit,
  softDeleteContract,
  updateContract,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function saveContractAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());
  const parsed = contractInputSchema.safeParse({
    ...raw,
    type: raw.type || "amc",
    status: raw.status || "active",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  let cid: string;
  try {
    cid = id
      ? (await updateContract(ctx, id, parsed.data)).id
      : (await createContract(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
  revalidatePath("/contracts");
  redirect(`/contracts/${cid}`);
}

export async function createContractFromProjectAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const c = await createContractFromProject(
    ctx,
    formData.get("projectId") as string,
  );
  revalidatePath("/contracts");
  redirect(`/contracts/${c.id}`);
}

export async function deleteContractAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteContract(ctx, formData.get("id") as string);
  revalidatePath("/contracts");
  redirect("/contracts");
}

export async function addAssetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const contractId = formData.get("contractId") as string;
  const parsed = assetInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    category: formData.get("category") || "controller",
    status: formData.get("status") || "active",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await addAsset(ctx, contractId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function scheduleVisitAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const contractId = formData.get("contractId") as string;
  const parsed = visitInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { error: "Pick a date." };
  try {
    await scheduleVisit(ctx, contractId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function completeVisitAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await completeVisit(ctx, formData.get("visitId") as string);
  revalidatePath(`/contracts/${formData.get("contractId")}`);
}
