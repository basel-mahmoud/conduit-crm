/**
 * Syncs Clerk identities into the local `users` table.
 *
 * Two entry points:
 *  - `resolveUser` — called just-in-time from the auth context on first request,
 *    so a freshly signed-in user works even before the webhook fires.
 *  - `syncClerkUser` / `deleteClerkUser` — called by the Clerk webhook to keep
 *    profile data and status in sync over time.
 *
 * Linking strategy (no schema change): match an existing row by `id` (Clerk id),
 * else by email (adopts a seeded/invited row — e.g. the org owner), else JIT-create
 * a new row in the sole organization with **no roles** (an admin grants access).
 */
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { organizations, users } from "@/db/schema";

export interface ClerkIdentity {
  id: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/** Resolve the internal `users.id` for a Clerk identity, linking/creating as needed. */
export async function resolveUser(clerk: ClerkIdentity): Promise<string | null> {
  // 1) Already linked by Clerk id.
  const [byId] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, clerk.id))
    .limit(1);
  if (byId) {
    await touch(byId.id);
    return byId.id;
  }

  // 2) Link by email to an existing row (seeded owner / invited teammate).
  if (clerk.email) {
    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.email})`, clerk.email.toLowerCase()))
      .limit(1);
    if (byEmail) {
      await db
        .update(users)
        .set({
          status: "active",
          firstName: clerk.firstName ?? undefined,
          lastName: clerk.lastName ?? undefined,
          avatarUrl: clerk.avatarUrl ?? undefined,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id));
      return byEmail.id;
    }
  }

  // 3) JIT-provision a brand-new user into the sole organization, with no roles.
  if (!clerk.email) return null;
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .orderBy(asc(organizations.createdAt))
    .limit(1);
  if (!org) return null;

  await db
    .insert(users)
    .values({
      id: clerk.id,
      orgId: org.id,
      email: clerk.email,
      firstName: clerk.firstName ?? null,
      lastName: clerk.lastName ?? null,
      avatarUrl: clerk.avatarUrl ?? null,
      status: "active",
      lastSeenAt: new Date(),
    })
    .onConflictDoNothing();
  return clerk.id;
}

async function touch(id: string): Promise<void> {
  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, id));
}

/** Shape of a Clerk `user.created` / `user.updated` webhook payload (subset). */
interface ClerkUserWebhookData {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

/** Upsert from a Clerk `user.created` / `user.updated` webhook event. */
export async function syncClerkUser(data: ClerkUserWebhookData): Promise<void> {
  const emails = data.email_addresses ?? [];
  const primary =
    emails.find((e) => e.id === data.primary_email_address_id) ?? emails[0];
  await resolveUser({
    id: data.id,
    email: primary?.email_address ?? null,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    avatarUrl: data.image_url ?? null,
  });
}

/** Soft-deactivate on a Clerk `user.deleted` event (FKs preserved for audit). */
export async function deleteClerkUser(clerkId: string): Promise<void> {
  await db
    .update(users)
    .set({ status: "deactivated", updatedAt: new Date() })
    .where(eq(users.id, clerkId));
}
