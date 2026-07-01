"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireAuthContext } from "@/server/auth/context";
import { can } from "@/server/rbac/guard";

export interface OrgSettingsState {
  ok?: boolean;
  error?: string;
  fieldErrors?: { name?: string };
}

export async function updateOrgSettingsAction(
  _prev: OrgSettingsState,
  formData: FormData,
): Promise<OrgSettingsState> {
  const ctx = await requireAuthContext();

  if (!ctx.isAdmin && !can(ctx, "setting.manage") && !can(ctx, "org.manage")) {
    return { error: "You don't have permission to change organization settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { fieldErrors: { name: "Organization name must be at least 2 characters." } };
  }

  await db
    .update(organizations)
    .set({ name, updatedAt: new Date() })
    .where(eq(organizations.id, ctx.orgId));

  revalidatePath("/settings");
  return { ok: true };
}
