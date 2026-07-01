"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { TICKET_STATUSES, type TicketStatusKey } from "./labels";
import { resolveInputSchema, ticketInputSchema } from "./schema";
import {
  assignTicket,
  createTicket,
  resolveTicket,
  setTicketStatus,
  softDeleteTicket,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createTicketAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const parsed = ticketInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    type: formData.get("type") || "breakdown",
    priority: formData.get("priority") || "p3",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  let tid: string;
  try {
    tid = (await createTicket(ctx, parsed.data)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/service");
  redirect(`/service/${tid}`);
}

export async function assignTicketAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  await assignTicket(ctx, id);
  revalidatePath(`/service/${id}`);
}

export async function setTicketStatusAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if ((TICKET_STATUSES as readonly string[]).includes(status)) {
    await setTicketStatus(ctx, id, status as TicketStatusKey);
  }
  revalidatePath(`/service/${id}`);
}

export async function resolveTicketAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  const parsed = resolveInputSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: "Add a resolution note.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await resolveTicket(ctx, id, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/service/${id}`);
  return {};
}

export async function deleteTicketAction(formData: FormData) {
  const ctx = await requireAuthContext();
  await softDeleteTicket(ctx, formData.get("id") as string);
  revalidatePath("/service");
  redirect("/service");
}
