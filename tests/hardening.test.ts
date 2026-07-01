import { describe, expect, it } from "vitest";

import { rateLimit } from "@/server/rate-limit";
import { computeRowHash, type AuditPayload } from "@/server/audit/hash";
import { SLA_TARGETS, slaState } from "@/modules/service/labels";

describe("rateLimit", () => {
  it("allows up to the limit then blocks with a retry window", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe("SLA state", () => {
  it("targets: response < resolve for each priority", () => {
    for (const p of ["p1", "p2", "p3", "p4"] as const) {
      expect(SLA_TARGETS[p].responseMins).toBeLessThan(SLA_TARGETS[p].resolveMins);
    }
  });
  it("resolved → met, open+overdue → breached, near due → due_soon", () => {
    expect(
      slaState({ status: "resolved", slaDueAt: new Date(Date.now() - 1000), resolvedAt: new Date() }),
    ).toBe("met");
    expect(
      slaState({ status: "open", slaDueAt: new Date(Date.now() - 1000), resolvedAt: null }),
    ).toBe("breached");
    expect(
      slaState({ status: "in_progress", slaDueAt: new Date(Date.now() + 30 * 60_000), resolvedAt: null }),
    ).toBe("due_soon");
    expect(
      slaState({ status: "open", slaDueAt: new Date(Date.now() + 5 * 3_600_000), resolvedAt: null }),
    ).toBe("on_track");
  });
});

describe("audit chain integrity (multi-entry)", () => {
  const build = (count: number) => {
    const chain: { payload: AuditPayload; prevHash: string | null; rowHash: string }[] = [];
    let prev: string | null = null;
    for (let i = 0; i < count; i++) {
      const payload: AuditPayload = {
        orgId: "o1",
        action: "test",
        resource: "r",
        resourceId: String(i),
      };
      const rowHash = computeRowHash(payload, prev);
      chain.push({ payload, prevHash: prev, rowHash });
      prev = rowHash;
    }
    return chain;
  };

  it("recomputes an intact chain", () => {
    const c = build(6);
    let prev: string | null = null;
    for (const e of c) {
      expect(computeRowHash(e.payload, prev)).toBe(e.rowHash);
      prev = e.rowHash;
    }
  });

  it("detects a tampered middle entry", () => {
    const c = build(6);
    const tampered: AuditPayload = { ...c[3].payload, resourceId: "hacked" };
    expect(computeRowHash(tampered, c[3].prevHash)).not.toBe(c[3].rowHash);
  });
});
