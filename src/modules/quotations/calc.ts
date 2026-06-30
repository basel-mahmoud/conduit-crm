/**
 * Quotation math — exact, in integer cents (fils), to avoid float drift.
 * Pure + isomorphic: imported by the server (persist) and the client builder
 * (live totals). Covered by golden tests in tests/calc.test.ts.
 *
 * Each line carries the 4-way cost build-up per unit (material / labor /
 * engineering / subcontractor) plus a markup %. Sell unit price =
 * unitCost × (1 + markup). Margin is on the net (post-discount) sell value.
 */
export interface CalcLine {
  qty: number;
  materialUnitCost: number;
  laborUnitCost: number;
  engineeringUnitCost: number;
  subcontractorUnitCost: number;
  markupPct: number;
}

export interface LineTotals {
  unitCost: number;
  unitPrice: number;
  lineCost: number;
  lineTotal: number;
}

export interface QuotationTotals {
  materialCost: number;
  laborCost: number;
  engineeringCost: number;
  subcontractorCost: number;
  totalCost: number;
  subtotal: number;
  discountAmount: number;
  netSubtotal: number;
  vatAmount: number;
  grandTotal: number;
  marginAmount: number;
  marginPct: number;
}

const toCents = (n: number) => Math.round((Number(n) || 0) * 100);
const fromCents = (c: number) => c / 100;
const num = (n: number) => Number(n) || 0;

interface LineCents {
  mat: number;
  lab: number;
  eng: number;
  sub: number;
  unitCostCents: number;
  lineCostCents: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

function lineCents(l: CalcLine): LineCents {
  const qty = num(l.qty);
  const matU = toCents(l.materialUnitCost);
  const labU = toCents(l.laborUnitCost);
  const engU = toCents(l.engineeringUnitCost);
  const subU = toCents(l.subcontractorUnitCost);

  const mat = Math.round(matU * qty);
  const lab = Math.round(labU * qty);
  const eng = Math.round(engU * qty);
  const sub = Math.round(subU * qty);

  const unitCostCents = matU + labU + engU + subU;
  const lineCostCents = mat + lab + eng + sub;
  const unitPriceCents = Math.round(unitCostCents * (1 + num(l.markupPct) / 100));
  const lineTotalCents = Math.round(unitPriceCents * qty);

  return { mat, lab, eng, sub, unitCostCents, lineCostCents, unitPriceCents, lineTotalCents };
}

/** Per-line display figures (AED). */
export function calcLineTotals(l: CalcLine): LineTotals {
  const c = lineCents(l);
  return {
    unitCost: fromCents(c.unitCostCents),
    unitPrice: fromCents(c.unitPriceCents),
    lineCost: fromCents(c.lineCostCents),
    lineTotal: fromCents(c.lineTotalCents),
  };
}

export function calcQuotation(
  lines: CalcLine[],
  discountPct: number,
  vatRate: number,
): QuotationTotals {
  let material = 0;
  let labor = 0;
  let engineering = 0;
  let subcontractor = 0;
  let totalCost = 0;
  let subtotal = 0;

  for (const l of lines) {
    const c = lineCents(l);
    material += c.mat;
    labor += c.lab;
    engineering += c.eng;
    subcontractor += c.sub;
    totalCost += c.lineCostCents;
    subtotal += c.lineTotalCents;
  }

  const discount = Math.round((subtotal * num(discountPct)) / 100);
  const netSubtotal = subtotal - discount;
  const vat = Math.round(netSubtotal * num(vatRate));
  const grand = netSubtotal + vat;
  const marginAmount = netSubtotal - totalCost;
  const marginPct =
    netSubtotal > 0
      ? Math.round((marginAmount / netSubtotal) * 10000) / 100
      : 0;

  return {
    materialCost: fromCents(material),
    laborCost: fromCents(labor),
    engineeringCost: fromCents(engineering),
    subcontractorCost: fromCents(subcontractor),
    totalCost: fromCents(totalCost),
    subtotal: fromCents(subtotal),
    discountAmount: fromCents(discount),
    netSubtotal: fromCents(netSubtotal),
    vatAmount: fromCents(vat),
    grandTotal: fromCents(grand),
    marginAmount: fromCents(marginAmount),
    marginPct,
  };
}

/** Discounts above this % require management approval. */
export const DISCOUNT_APPROVAL_THRESHOLD = 5;
