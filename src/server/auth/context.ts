/**
 * Resolves the current request's AuthContext (identity + org + effective grants).
 *
 * - When Clerk is configured, identity comes from the Clerk session.
 * - Otherwise a dev fallback resolves the seeded owner/admin so the product is
 *   usable before Clerk keys are wired. The fallback is clearly gated on the
 *   absence of Clerk env and must never be relied on in a real deployment.
 */
import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations, roles, userRoles, users } from "@/db/schema";
import { resolveGrants, SYSTEM_ROLE_BY_KEY } from "@/server/rbac/roles";
import type { RoleKey } from "@/server/rbac/roles";
import type { AuthContext } from "@/server/rbac/guard";

export const clerkEnabled =
  !!process.env.CLERK_SECRET_KEY &&
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function buildContext(userId: string): Promise<AuthContext | null> {
  const [u] = await db
    .select({ id: users.id, orgId: users.orgId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const rows = await db
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));

  const roleKeys = rows.map((r) => r.key);
  return {
    userId: u.id,
    orgId: u.orgId,
    roleKeys,
    grants: resolveGrants(roleKeys),
    isAdmin: roleKeys.includes("admin"),
    branchId: null,
  };
}

/** Memoised per request. */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (clerkEnabled) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    return buildContext(userId);
  }

  // Dev fallback: first active seeded user (the owner/admin).
  const [fallback] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(asc(users.createdAt))
    .limit(1);
  if (!fallback) return null;
  return buildContext(fallback.id);
});

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    const { AuthenticationError } = await import("@/server/rbac/guard");
    throw new AuthenticationError();
  }
  return ctx;
}

export interface CurrentUserDisplay {
  name: string;
  email: string;
  roleName: string;
  orgName: string;
  initials: string;
}

/** Display profile for the shell (real signed-in user). */
export const getCurrentUserDisplay = cache(
  async (): Promise<CurrentUserDisplay | null> => {
    const ctx = await getAuthContext();
    if (!ctx) return null;

    const [u] = await db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    const name =
      [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
      u?.email ||
      "User";
    const primary = ctx.roleKeys[0] as RoleKey | undefined;
    const roleName = primary
      ? (SYSTEM_ROLE_BY_KEY[primary]?.name ?? primary)
      : "Member";
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      name,
      email: u?.email ?? "",
      roleName,
      orgName: org?.name ?? "Conduit",
      initials,
    };
  },
);
