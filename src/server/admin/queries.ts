import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { rolePermissions, roles, userRoles, users } from "@/db/schema";

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  roles: string[];
}

export async function listUsersWithRoles(
  orgId: string,
): Promise<UserWithRoles[]> {
  const people = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
    })
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(users.email);

  const assignments = await db
    .select({ userId: userRoles.userId, roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(roles.orgId, orgId));

  const byUser = new Map<string, string[]>();
  for (const a of assignments) {
    const arr = byUser.get(a.userId) ?? [];
    arr.push(a.roleName);
    byUser.set(a.userId, arr);
  }

  return people.map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
}

export interface RoleWithCount {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
}

export async function listRolesWithCounts(
  orgId: string,
): Promise<RoleWithCount[]> {
  const rows = await db
    .select({
      id: roles.id,
      key: roles.key,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
    })
    .from(roles)
    .where(eq(roles.orgId, orgId))
    .orderBy(roles.name);

  const counts = await db
    .select({ roleId: rolePermissions.roleId, c: count() })
    .from(rolePermissions)
    .innerJoin(roles, eq(roles.id, rolePermissions.roleId))
    .where(eq(roles.orgId, orgId))
    .groupBy(rolePermissions.roleId);

  const byRole = new Map(counts.map((c) => [c.roleId, Number(c.c)]));
  return rows.map((r) => ({ ...r, permissionCount: byRole.get(r.id) ?? 0 }));
}
