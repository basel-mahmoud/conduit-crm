/**
 * Database seed — idempotent. Safe to re-run.
 *
 * Seeds: the Conduit organization, the permission catalog, the 11 system roles
 * with their grants, an owner/admin user (used by the dev-auth fallback until
 * Clerk is wired), and the document-number sequences.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  numberSequences,
  organizations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "@/db/schema";
import { PERMISSION_DEFS, permissionDescription } from "@/server/rbac/permissions";
import { SYSTEM_ROLES } from "@/server/rbac/roles";

const ORG = { name: "Conduit", slug: "conduit", currency: "AED" };

const OWNER = {
  id: "usr_dev_owner",
  email: "owner@conduit.local",
  firstName: "Basel",
  lastName: "Mahmoud",
};

const SEQUENCES: { kind: string; prefix: string; padding: number }[] = [
  { kind: "lead", prefix: "LEAD-", padding: 4 },
  { kind: "opportunity", prefix: "OPP-", padding: 4 },
  { kind: "quotation", prefix: "QT-2026-", padding: 4 },
  { kind: "project", prefix: "PRJ-", padding: 4 },
  { kind: "contract", prefix: "AMC-", padding: 4 },
  { kind: "ticket", prefix: "TKT-2026-", padding: 4 },
  { kind: "po", prefix: "PO-2026-", padding: 4 },
];

async function main() {
  // 1. Organization
  await db
    .insert(organizations)
    .values(ORG)
    .onConflictDoNothing({ target: organizations.slug });
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, ORG.slug))
    .limit(1);
  if (!org) throw new Error("Failed to create organization");
  console.log(`org: ${org.id}`);

  // 2. Permission catalog (global)
  await db
    .insert(permissions)
    .values(
      PERMISSION_DEFS.map((p) => ({
        key: p.key,
        resource: p.resource,
        action: p.action,
        description: permissionDescription(p),
      })),
    )
    .onConflictDoNothing();
  console.log(`permissions: ${PERMISSION_DEFS.length}`);

  // 3. System roles
  await db
    .insert(roles)
    .values(
      SYSTEM_ROLES.map((r) => ({
        orgId: org.id,
        key: r.key,
        name: r.name,
        description: r.description,
        isSystem: true,
      })),
    )
    .onConflictDoNothing({ target: [roles.orgId, roles.key] });

  const roleRows = await db
    .select({ id: roles.id, key: roles.key })
    .from(roles)
    .where(eq(roles.orgId, org.id));
  const roleIdByKey = new Map(roleRows.map((r) => [r.key, r.id]));
  console.log(`roles: ${roleRows.length}`);

  // 4. Role → permission grants
  const grantRows: {
    roleId: string;
    permissionKey: string;
    scope: "own" | "team" | "branch" | "org";
  }[] = [];
  for (const role of SYSTEM_ROLES) {
    const roleId = roleIdByKey.get(role.key);
    if (!roleId) continue;
    for (const [permissionKey, scope] of Object.entries(role.grants)) {
      grantRows.push({ roleId, permissionKey, scope: scope as "org" });
    }
  }
  if (grantRows.length) {
    await db.insert(rolePermissions).values(grantRows).onConflictDoNothing();
  }
  console.log(`grants: ${grantRows.length}`);

  // 5. Owner / admin user (dev-auth fallback identity)
  await db
    .insert(users)
    .values({
      id: OWNER.id,
      orgId: org.id,
      email: OWNER.email,
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
      status: "active",
    })
    .onConflictDoNothing({ target: users.id });

  const adminRoleId = roleIdByKey.get("admin");
  if (adminRoleId) {
    await db
      .insert(userRoles)
      .values({ userId: OWNER.id, roleId: adminRoleId })
      .onConflictDoNothing();
  }
  console.log(`owner: ${OWNER.id} (admin)`);

  // 6. Document-number sequences
  await db
    .insert(numberSequences)
    .values(SEQUENCES.map((s) => ({ orgId: org.id, ...s })))
    .onConflictDoNothing({
      target: [numberSequences.orgId, numberSequences.kind],
    });
  console.log(`sequences: ${SEQUENCES.length}`);

  console.log("✓ seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
