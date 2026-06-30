import { describe, expect, it } from "vitest";

import { leadInputSchema } from "@/modules/leads/schema";
import { opportunityInputSchema } from "@/modules/opportunities/schema";
import { OPP_STAGES, STAGE_META } from "@/modules/opportunities/labels";

describe("leadInputSchema", () => {
  it("accepts a minimal valid lead", () => {
    expect(
      leadInputSchema.safeParse({ projectName: "Marina BMS" }).success,
    ).toBe(true);
  });
  it("rejects a short project name", () => {
    expect(leadInputSchema.safeParse({ projectName: "X" }).success).toBe(false);
  });
  it("coerces empty estValue to undefined", () => {
    const r = leadInputSchema.safeParse({ projectName: "Marina", estValue: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.estValue).toBeUndefined();
  });
});

describe("opportunityInputSchema", () => {
  it("accepts a valid opportunity", () => {
    expect(
      opportunityInputSchema.safeParse({ name: "DIFC Tower" }).success,
    ).toBe(true);
  });
  it("rejects probability over 100", () => {
    expect(
      opportunityInputSchema.safeParse({ name: "DIFC", probability: "150" })
        .success,
    ).toBe(false);
  });
  it("rejects an unknown stage", () => {
    expect(
      opportunityInputSchema.safeParse({ name: "DIFC", stage: "nope" }).success,
    ).toBe(false);
  });
});

describe("stage metadata", () => {
  it("defines metadata for every stage", () => {
    for (const s of OPP_STAGES) {
      expect(STAGE_META[s]).toBeDefined();
      expect(STAGE_META[s].probability).toBeGreaterThanOrEqual(0);
      expect(STAGE_META[s].probability).toBeLessThanOrEqual(100);
    }
  });
  it("won is 100% and lost is 0%", () => {
    expect(STAGE_META.won.probability).toBe(100);
    expect(STAGE_META.lost.probability).toBe(0);
  });
});
