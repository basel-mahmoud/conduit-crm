"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { OPP_STAGES, type OppStageKey } from "./labels";
import { opportunityInputSchema } from "./schema";
import {
  createOpportunity,
  softDeleteOpportunity,
  updateOpportunity,
  updateStage,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function saveOpportunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());

  const parsed = opportunityInputSchema.safeParse({
    ...raw,
    stage: raw.stage || "new",
    projectType: raw.projectType || "bms",
    consultantApproval: raw.consultantApproval || "na",
    contractorApproval: raw.contractorApproval || "na",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let oppId: string;
  try {
    oppId = id
      ? (await updateOpportunity(ctx, id, parsed.data)).id
      : (await createOpportunity(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/opportunities");
  redirect(`/opportunities/${oppId}`);
}

export async function deleteOpportunityAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteOpportunity(ctx, formData.get("id") as string);
  revalidatePath("/opportunities");
  redirect("/opportunities");
}

/** Form-based stage change (Won/Lost buttons on the detail page). */
export async function setStageAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  const stage = formData.get("stage") as string;
  if ((OPP_STAGES as readonly string[]).includes(stage)) {
    await updateStage(ctx, id, stage as OppStageKey);
  }
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
}

/** Kanban drag → persist new stage. Called directly from the client board. */
export async function moveStageAction(
  id: string,
  stage: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuthContext();
  if (!(OPP_STAGES as readonly string[]).includes(stage)) {
    return { ok: false, error: "Invalid stage" };
  }
  try {
    await updateStage(ctx, id, stage as OppStageKey);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
  revalidatePath("/opportunities");
  return { ok: true };
}
