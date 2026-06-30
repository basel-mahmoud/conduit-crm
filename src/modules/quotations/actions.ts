"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { QUOTATION_STATUSES, type QuotationStatusKey } from "./labels";
import { saveRevisionSchema } from "./schema";
import {
  createQuotationFromOpportunity,
  decideDiscount,
  newRevision,
  saveRevision,
  setQuotationStatus,
  softDeleteQuotation,
} from "./service";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export async function createQuotationFromOpportunityAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const oppId = formData.get("opportunityId") as string;
  const q = await createQuotationFromOpportunity(ctx, oppId);
  revalidatePath("/quotations");
  redirect(`/quotations/${q.id}`);
}

/** Builder save — invoked from the client with a structured payload. */
export async function saveRevisionAction(
  revisionId: string,
  quotationId: string,
  payload: unknown,
): Promise<SaveResult> {
  const ctx = await requireAuthContext();
  const parsed = saveRevisionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Invalid quotation data." };
  try {
    await saveRevision(ctx, revisionId, parsed.data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
  revalidatePath(`/quotations/${quotationId}`);
  return { ok: true };
}

export async function newRevisionAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("quotationId") as string;
  await newRevision(ctx, id);
  revalidatePath(`/quotations/${id}`);
}

export async function setStatusAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if ((QUOTATION_STATUSES as readonly string[]).includes(status)) {
    await setQuotationStatus(ctx, id, status as QuotationStatusKey);
  }
  revalidatePath(`/quotations/${id}`);
}

export async function decideDiscountAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const approvalId = formData.get("approvalId") as string;
  const quotationId = formData.get("quotationId") as string;
  const decision = formData.get("decision") as string;
  if (decision === "approved" || decision === "rejected") {
    await decideDiscount(ctx, approvalId, decision);
  }
  revalidatePath(`/quotations/${quotationId}`);
}

export async function deleteQuotationAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteQuotation(ctx, formData.get("id") as string);
  revalidatePath("/quotations");
  redirect("/quotations");
}
