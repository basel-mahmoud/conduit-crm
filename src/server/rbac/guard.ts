/**
 * Authorization guard. Centralised, server-side. Every mutation passes through
 * `requirePermission`; the client only ever hides what the server already forbids.
 */
import type { PermissionKey, Scope } from "./permissions";

export interface AuthContext {
  userId: string;
  orgId: string;
  roleKeys: string[];
  /** Effective permission → widest granted scope. */
  grants: Map<PermissionKey, Scope>;
  isAdmin: boolean;
  branchId?: string | null;
}

/** Minimal record shape used for record-scoped checks. */
export interface ResourceRef {
  ownerId?: string | null;
  branchId?: string | null;
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(public readonly permission: PermissionKey) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  readonly status = 401;
  constructor() {
    super("Not authenticated");
    this.name = "AuthenticationError";
  }
}

/**
 * Capability + record-scope check.
 * - No `resource` → capability check only (can the user do this at all?).
 * - With `resource` → also enforce `own`/`branch` scope. `team` resolution is
 *   refined per-module once teams/assignments exist (M3+); treated as allowed
 *   at this layer and narrowed in list queries.
 */
export function can(
  ctx: AuthContext,
  permission: PermissionKey,
  resource?: ResourceRef,
): boolean {
  const scope = ctx.grants.get(permission);
  if (!scope) return false;
  if (!resource) return true;

  switch (scope) {
    case "org":
      return true;
    case "branch":
      return !resource.branchId || resource.branchId === ctx.branchId;
    case "team":
      return true;
    case "own":
      return !resource.ownerId || resource.ownerId === ctx.userId;
    default:
      return false;
  }
}

export function requirePermission(
  ctx: AuthContext,
  permission: PermissionKey,
  resource?: ResourceRef,
): void {
  if (!can(ctx, permission, resource)) {
    throw new AuthorizationError(permission);
  }
}

/** Field-level: may this user see cost build-up & margin figures? */
export function canViewCost(ctx: AuthContext): boolean {
  return ctx.grants.has("quotation.cost.view");
}

/** The widest scope at which a user holds a permission (for list filtering). */
export function scopeOf(
  ctx: AuthContext,
  permission: PermissionKey,
): Scope | null {
  return ctx.grants.get(permission) ?? null;
}
