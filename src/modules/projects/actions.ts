"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { SNAG_STATUSES, type SnagStatusKey } from "./labels";
import {
  milestoneInputSchema,
  phasesInputSchema,
  projectInputSchema,
  snagInputSchema,
} from "./schema";
import {
  addMilestone,
  addSnag,
  createProject,
  createProjectFromQuotation,
  savePhases,
  softDeleteProject,
  toggleMilestone,
  updateProject,
  updateSnagStatus,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}
export interface SaveResult {
  ok: boolean;
  error?: string;
}

export async function createProjectFromQuotationAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const p = await createProjectFromQuotation(
    ctx,
    formData.get("quotationId") as string,
  );
  revalidatePath("/projects");
  redirect(`/projects/${p.id}`);
}

export async function saveProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());
  const parsed = projectInputSchema.safeParse({
    ...raw,
    projectType: raw.projectType || "bms",
    status: raw.status || "registered",
    health: raw.health || "on_track",
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
      ? (await updateProject(ctx, id, parsed.data)).id
      : (await createProject(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
  revalidatePath("/projects");
  redirect(`/projects/${pid}`);
}

export async function savePhasesAction(
  projectId: string,
  phases: unknown,
): Promise<SaveResult> {
  const ctx = await requireAuthContext();
  const parsed = phasesInputSchema.safeParse({ phases });
  if (!parsed.success) return { ok: false, error: "Invalid phase data." };
  try {
    await savePhases(ctx, projectId, parsed.data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function addMilestoneAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const projectId = formData.get("projectId") as string;
  const parsed = milestoneInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: "Title is required.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await addMilestone(ctx, projectId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function toggleMilestoneAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await toggleMilestone(ctx, formData.get("milestoneId") as string);
  revalidatePath(`/projects/${formData.get("projectId")}`);
}

export async function addSnagAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const projectId = formData.get("projectId") as string;
  const parsed = snagInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    severity: formData.get("severity") || "medium",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await addSnag(ctx, projectId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function updateSnagStatusAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const snagId = formData.get("snagId") as string;
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as string;
  if ((SNAG_STATUSES as readonly string[]).includes(status)) {
    await updateSnagStatus(ctx, snagId, status as SnagStatusKey);
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteProject(ctx, formData.get("id") as string);
  revalidatePath("/projects");
  redirect("/projects");
}
