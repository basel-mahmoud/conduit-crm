"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthContext } from "@/server/auth/context";
import { accountInputSchema, contactInputSchema } from "./schema";
import {
  addContact,
  createAccount,
  softDeleteAccount,
  updateAccount,
} from "./service";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function saveAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const id = (formData.get("id") as string | null) || null;
  const raw = Object.fromEntries(formData.entries());

  const parsed = accountInputSchema.safeParse({
    ...raw,
    rating: raw.rating || "b",
    status: raw.status || "active",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let accountId: string;
  try {
    if (id) {
      const a = await updateAccount(ctx, id, parsed.data);
      accountId = a.id;
    } else {
      const a = await createAccount(ctx, parsed.data);
      accountId = a.id;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/accounts");
  redirect(`/accounts/${accountId}`);
}

export async function addContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requireAuthContext();
  const accountId = formData.get("accountId") as string;
  const raw = Object.fromEntries(formData.entries());

  const parsed = contactInputSchema.safeParse({
    ...raw,
    isPrimary: raw.isPrimary === "on" || raw.isPrimary === "true",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await addContact(ctx, accountId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add contact." };
  }

  revalidatePath(`/accounts/${accountId}`);
  return {};
}

export async function deleteAccountAction(formData: FormData) {
  const ctx = await requireAuthContext();
  const id = formData.get("id") as string;
  await softDeleteAccount(ctx, id);
  revalidatePath("/accounts");
  redirect("/accounts");
}
