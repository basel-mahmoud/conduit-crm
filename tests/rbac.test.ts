import { describe, expect, it } from "vitest";

import { ALL_PERMISSION_KEYS } from "@/server/rbac/permissions";
import { SYSTEM_ROLES, resolveGrants } from "@/server/rbac/roles";
import { can, canViewCost, type AuthContext } from "@/server/rbac/guard";

function ctxFor(roleKeys: string[], userId = "u1", orgId = "o1"): AuthContext {
  return {
    userId,
    orgId,
    roleKeys,
    grants: resolveGrants(roleKeys),
    isAdmin: roleKeys.includes("admin"),
    branchId: null,
  };
}

describe("permission catalog integrity", () => {
  it("every role grant references a real permission key", () => {
    const valid = new Set<string>(ALL_PERMISSION_KEYS);
    for (const role of SYSTEM_ROLES) {
      for (const key of Object.keys(role.grants)) {
        expect(valid.has(key), `${role.key} → ${key}`).toBe(true);
      }
    }
  });
});

describe("resolveGrants", () => {
  it("admin holds every permission at org scope", () => {
    const g = resolveGrants(["admin"]);
    expect(g.size).toBe(ALL_PERMISSION_KEYS.length);
    for (const k of ALL_PERMISSION_KEYS) expect(g.get(k)).toBe("org");
  });

  it("merges to the widest scope across roles", () => {
    // sales_engineer: account.read=team · service_manager: account.read=org → org wins
    const g = resolveGrants(["sales_engineer", "service_manager"]);
    expect(g.get("account.read")).toBe("org");
  });

  it("ignores unknown role keys", () => {
    expect(resolveGrants(["does_not_exist"]).size).toBe(0);
  });
});

describe("financial field visibility (cost/margin)", () => {
  it("sales engineer cannot view cost", () => {
    expect(canViewCost(ctxFor(["sales_engineer"]))).toBe(false);
  });
  it("estimation engineer can view cost", () => {
    expect(canViewCost(ctxFor(["estimation_engineer"]))).toBe(true);
  });
  it("service engineer cannot view cost", () => {
    expect(canViewCost(ctxFor(["service_engineer"]))).toBe(false);
  });
});

describe("guard.can — capability + scope", () => {
  it("denies a permission the role lacks", () => {
    expect(can(ctxFor(["service_engineer"]), "quotation.create")).toBe(false);
  });
  it("allows a granted capability", () => {
    expect(can(ctxFor(["sales_engineer"]), "lead.create")).toBe(true);
  });
  it("own scope blocks records owned by others", () => {
    const ctx = ctxFor(["sales_engineer"], "u1");
    expect(can(ctx, "lead.read", { ownerId: "u1" })).toBe(true);
    expect(can(ctx, "lead.read", { ownerId: "u2" })).toBe(false);
  });
  it("org scope sees every record", () => {
    const ctx = ctxFor(["service_manager"]);
    expect(can(ctx, "ticket.read", { ownerId: "someone-else" })).toBe(true);
  });
});
