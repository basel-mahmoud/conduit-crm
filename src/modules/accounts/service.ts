/**
 * Accounts & contacts service. Every query is org-scoped (tenant isolation),
 * every action is permission-guarded and audit-logged inside a transaction.
 */
import { and, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { accounts, activityEvents, contacts } from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { requirePermission, scopeOf, type AuthContext } from "@/server/rbac/guard";
import type { AccountTypeKey } from "./labels";
import type { AccountInput, ContactInput } from "./schema";

export interface AccountFilters {
  q?: string;
  type?: AccountTypeKey;
}

export async function listAccounts(ctx: AuthContext, filters: AccountFilters = {}) {
  requirePermission(ctx, "account.read");

  const conds: SQL[] = [
    eq(accounts.orgId, ctx.orgId),
    isNull(accounts.deletedAt),
  ];
  if (scopeOf(ctx, "account.read") === "own") {
    conds.push(eq(accounts.ownerId, ctx.userId));
  }
  if (filters.type) conds.push(eq(accounts.type, filters.type));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(ilike(accounts.name, term), ilike(accounts.email, term)) as SQL,
    );
  }

  return db
    .select()
    .from(accounts)
    .where(and(...conds))
    .orderBy(desc(accounts.createdAt))
    .limit(200);
}

export async function getAccount(ctx: AuthContext, id: string) {
  requirePermission(ctx, "account.read");
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, id),
        eq(accounts.orgId, ctx.orgId),
        isNull(accounts.deletedAt),
      ),
    )
    .limit(1);
  if (!account) return null;
  if (scopeOf(ctx, "account.read") === "own" && account.ownerId !== ctx.userId) {
    return null;
  }
  return account;
}

export async function listContacts(ctx: AuthContext, accountId: string) {
  return db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.orgId, ctx.orgId),
        isNull(contacts.deletedAt),
      ),
    )
    .orderBy(desc(contacts.isPrimary), contacts.firstName);
}

export async function accountActivity(ctx: AuthContext, accountId: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "account"),
        eq(activityEvents.subjectId, accountId),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}

export async function createAccount(ctx: AuthContext, input: AccountInput) {
  requirePermission(ctx, "account.create");
  return db.transaction(async (tx) => {
    const [account] = await tx
      .insert(accounts)
      .values({
        ...input,
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "account",
      subjectId: account.id,
      type: "created",
      actorId: ctx.userId,
      payload: { name: account.name },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "account.create",
      resource: "account",
      resourceId: account.id,
      after: account,
    });
    return account;
  });
}

export async function updateAccount(
  ctx: AuthContext,
  id: string,
  input: AccountInput,
) {
  requirePermission(ctx, "account.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Account not found");

    const [after] = await tx
      .update(accounts)
      .set({ ...input, updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "account",
      subjectId: id,
      type: "updated",
      actorId: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "account.update",
      resource: "account",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

export async function softDeleteAccount(ctx: AuthContext, id: string) {
  requirePermission(ctx, "account.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Account not found");
    await tx
      .update(accounts)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(accounts.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "account.delete",
      resource: "account",
      resourceId: id,
      before,
    });
  });
}

/** Lightweight account picker options (id/name/type) for forms. */
export async function listAccountOptions(ctx: AuthContext) {
  requirePermission(ctx, "account.read");
  return db
    .select({ id: accounts.id, name: accounts.name, type: accounts.type })
    .from(accounts)
    .where(and(eq(accounts.orgId, ctx.orgId), isNull(accounts.deletedAt)))
    .orderBy(accounts.name)
    .limit(500);
}

export async function addContact(
  ctx: AuthContext,
  accountId: string,
  input: ContactInput,
) {
  requirePermission(ctx, "contact.manage");
  return db.transaction(async (tx) => {
    const [acc] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.orgId, ctx.orgId)))
      .limit(1);
    if (!acc) throw new Error("Account not found");

    const [contact] = await tx
      .insert(contacts)
      .values({
        ...input,
        orgId: ctx.orgId,
        accountId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "account",
      subjectId: accountId,
      type: "contact_added",
      actorId: ctx.userId,
      payload: { name: contact.firstName },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "contact.create",
      resource: "contact",
      resourceId: contact.id,
      after: contact,
    });
    return contact;
  });
}
