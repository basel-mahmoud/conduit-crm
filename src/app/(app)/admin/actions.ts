"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { requireAuthContext } from "@/server/auth/context";
import { can } from "@/server/rbac/guard";
import { SYSTEM_ROLES, type RoleKey } from "@/server/rbac/roles";

export interface SetRolesState {
  ok?: boolean;
  error?: string;
}

const VALID_KEYS = new Set(SYSTEM_ROLES.map((r) => r.key));

/** Replace a user's role assignments (admin-only, audited). */
export async function setUserRolesAction(
  _prev: SetRolesState,
  formData: FormData,
): Promise<SetRolesState> {
  const ctx = await requireAuthContext();
  if (!can(ctx, "user.manage")) {
    return { error: "You don't have permission to manage user access." };
  }

  const userId = String(formData.get("userId") ?? "");
  const requested = formData
    .getAll("roles")
    .map(String)
    .filter((k): k is RoleKey => VALID_KEYS.has(k as RoleKey));

  if (!userId) return { error: "Missing user." };

  const [target] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.orgId, ctx.orgId)))
    .limit(1);
  if (!target) return { error: "User not found in this organization." };

  // Safety rails: you can't remove your own admin role, and the org must
  // always keep at least one administrator.
  const wasAdmin = ctx.roleKeys.includes("admin");
  if (userId === ctx.userId && wasAdmin && !requested.includes("admin")) {
    return { error: "You can't remove your own Administrator role." };
  }
  if (!requested.includes("admin")) {
    const admins = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(and(eq(roles.orgId, ctx.orgId), eq(roles.key, "admin")));
    const remaining = admins.filter((a) => a.userId !== userId);
    const targetIsAdmin = admins.some((a) => a.userId === userId);
    if (targetIsAdmin && remaining.length === 0) {
      return { error: "The organization must keep at least one Administrator." };
    }
  }

  const orgRoles = requested.length
    ? await db
        .select({ id: roles.id, key: roles.key })
        .from(roles)
        .where(and(eq(roles.orgId, ctx.orgId), inArray(roles.key, requested)))
    : [];

  const before = await db
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));

  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.userId, userId));
    if (orgRoles.length) {
      await tx
        .insert(userRoles)
        .values(orgRoles.map((r) => ({ userId, roleId: r.id })));
    }
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "user.roles.set",
      resource: "user",
      resourceId: userId,
      before: { roles: before.map((b) => b.key) },
      after: { roles: orgRoles.map((r) => r.key) },
      metadata: { email: target.email },
    });
  });

  revalidatePath("/admin");
  return { ok: true };
}
