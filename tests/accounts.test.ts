import { describe, expect, it } from "vitest";

import { accountInputSchema } from "@/modules/accounts/schema";

describe("accountInputSchema", () => {
  it("accepts a minimal valid account", () => {
    const r = accountInputSchema.safeParse({ name: "Emaar", type: "developer" });
    expect(r.success).toBe(true);
  });

  it("rejects a too-short name", () => {
    expect(
      accountInputSchema.safeParse({ name: "E", type: "developer" }).success,
    ).toBe(false);
  });

  it("rejects an unknown account type", () => {
    expect(
      accountInputSchema.safeParse({ name: "Emaar", type: "nope" }).success,
    ).toBe(false);
  });

  it("treats an empty email string as undefined", () => {
    const r = accountInputSchema.safeParse({
      name: "Emaar",
      type: "developer",
      email: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBeUndefined();
  });

  it("rejects a malformed email", () => {
    expect(
      accountInputSchema.safeParse({
        name: "Emaar",
        type: "developer",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });
});
