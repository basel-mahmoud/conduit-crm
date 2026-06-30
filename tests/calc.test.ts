import { describe, expect, it } from "vitest";

import {
  calcLineTotals,
  calcQuotation,
  type CalcLine,
} from "@/modules/quotations/calc";

const line = (over: Partial<CalcLine> = {}): CalcLine => ({
  qty: 1,
  materialUnitCost: 0,
  laborUnitCost: 0,
  engineeringUnitCost: 0,
  subcontractorUnitCost: 0,
  markupPct: 0,
  ...over,
});

describe("calcLineTotals", () => {
  it("sums the 4-way cost build-up and applies markup", () => {
    const t = calcLineTotals(
      line({ qty: 2, materialUnitCost: 100, laborUnitCost: 50, markupPct: 20 }),
    );
    expect(t.unitCost).toBe(150);
    expect(t.unitPrice).toBe(180);
    expect(t.lineCost).toBe(300);
    expect(t.lineTotal).toBe(360);
  });
});

describe("calcQuotation", () => {
  const lines = [
    line({ qty: 2, materialUnitCost: 100, laborUnitCost: 50, markupPct: 20 }),
  ];

  it("computes totals, VAT and margin with no discount", () => {
    const r = calcQuotation(lines, 0, 0.05);
    expect(r.totalCost).toBe(300);
    expect(r.subtotal).toBe(360);
    expect(r.netSubtotal).toBe(360);
    expect(r.vatAmount).toBe(18);
    expect(r.grandTotal).toBe(378);
    expect(r.marginAmount).toBe(60);
    expect(r.marginPct).toBe(16.67);
  });

  it("applies a discount before VAT and margin", () => {
    const r = calcQuotation(lines, 10, 0.05);
    expect(r.discountAmount).toBe(36);
    expect(r.netSubtotal).toBe(324);
    expect(r.vatAmount).toBe(16.2);
    expect(r.grandTotal).toBe(340.2);
    expect(r.marginAmount).toBe(24);
    expect(r.marginPct).toBe(7.41);
  });

  it("aggregates cost categories across lines", () => {
    const r = calcQuotation(
      [
        line({ qty: 1, materialUnitCost: 1000, markupPct: 25 }),
        line({ qty: 3, laborUnitCost: 200, engineeringUnitCost: 100 }),
      ],
      0,
      0.05,
    );
    expect(r.materialCost).toBe(1000);
    expect(r.laborCost).toBe(600);
    expect(r.engineeringCost).toBe(300);
    expect(r.totalCost).toBe(1900);
    // line1 sell 1250, line2 sell 900 (markup 0) → 2150
    expect(r.subtotal).toBe(2150);
  });

  it("stays exact with fractional cents (no float drift)", () => {
    const r = calcQuotation(
      [line({ qty: 3, materialUnitCost: 33.33, markupPct: 0 })],
      0,
      0.05,
    );
    expect(r.totalCost).toBe(99.99);
    expect(r.subtotal).toBe(99.99);
    expect(r.vatAmount).toBe(5);
  });

  it("returns zero margin when net is zero", () => {
    const r = calcQuotation([], 0, 0.05);
    expect(r.grandTotal).toBe(0);
    expect(r.marginPct).toBe(0);
  });
});
