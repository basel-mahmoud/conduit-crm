"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { leadInputSchema } from "./schema";
import {
  convertLead,
  createLead,
  softDeleteLead,
  updateLead,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function saveLeadAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());

  const parsed = leadInputSchema.safeParse({
    ...raw,
    source: raw.source || "other",
    status: raw.status || "new",
    projectType: raw.projectType || "bms",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let leadId: string;
  try {
    leadId = id
      ? (await updateLead(ctx, id, parsed.data)).id
      : (await createLead(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/leads");
  redirect(`/leads/${leadId}`);
}

export async function deleteLeadAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteLead(ctx, formData.get("id") as string);
  revalidatePath("/leads");
  redirect("/leads");
}

export async function convertLeadAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const opp = await convertLead(ctx, formData.get("id") as string);
  revalidatePath("/leads");
  revalidatePath("/opportunities");
  redirect(`/opportunities/${opp.id}`);
}
