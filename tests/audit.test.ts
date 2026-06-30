import { describe, expect, it } from "vitest";

import { computeRowHash, type AuditPayload } from "@/server/audit/hash";

const base: AuditPayload = {
  orgId: "o1",
  actorId: "u1",
  action: "lead.create",
  resource: "lead",
  resourceId: "l1",
  after: { name: "ACME Controls" },
};

describe("audit hash chain", () => {
  it("is deterministic for identical payload + prevHash", () => {
    expect(computeRowHash(base, null)).toBe(computeRowHash(base, null));
  });

  it("links to prevHash (chain sensitivity)", () => {
    expect(computeRowHash(base, null)).not.toBe(
      computeRowHash(base, "deadbeef"),
    );
  });

  it("detects tampering in the payload", () => {
    const tampered: AuditPayload = { ...base, after: { name: "EVIL Corp" } };
    expect(computeRowHash(tampered, null)).not.toBe(computeRowHash(base, null));
  });

  it("produces a 64-char hex sha256", () => {
    expect(computeRowHash(base, null)).toMatch(/^[0-9a-f]{64}$/);
  });
});
