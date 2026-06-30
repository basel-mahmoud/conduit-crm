"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/format";
import { saveRevisionAction } from "@/modules/quotations/actions";
import { calcLineTotals, calcQuotation } from "@/modules/quotations/calc";
import { UNITS } from "@/modules/quotations/labels";

export interface BuilderLine {
  sectionTitle: string;
  description: string;
  qty: string;
  unit: string;
  materialUnitCost: string;
  laborUnitCost: string;
  engineeringUnitCost: string;
  subcontractorUnitCost: string;
  markupPct: string;
}

interface Props {
  revisionId: string;
  quotationId: string;
  vatRate: number;
  initialLines: BuilderLine[];
  initialDiscountPct: string;
  initialValidUntil: string;
  initialNotes: string;
  canViewCost: boolean;
  editable: boolean;
}

const n = (v: string) => Number(v) || 0;

const blankLine = (section = "General"): BuilderLine => ({
  sectionTitle: section,
  description: "",
  qty: "1",
  unit: "nos",
  materialUnitCost: "0",
  laborUnitCost: "0",
  engineeringUnitCost: "0",
  subcontractorUnitCost: "0",
  markupPct: "15",
});

export function QuotationBuilder(props: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<BuilderLine[]>(props.initialLines);
  const [discountPct, setDiscountPct] = useState(props.initialDiscountPct);
  const [validUntil, setValidUntil] = useState(props.initialValidUntil);
  const [notes, setNotes] = useState(props.initialNotes);
  const [saving, startSave] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      calcQuotation(
        lines.map((l) => ({
          qty: n(l.qty),
          materialUnitCost: n(l.materialUnitCost),
          laborUnitCost: n(l.laborUnitCost),
          engineeringUnitCost: n(l.engineeringUnitCost),
          subcontractorUnitCost: n(l.subcontractorUnitCost),
          markupPct: n(l.markupPct),
        })),
        n(discountPct),
        props.vatRate,
      ),
    [lines, discountPct, props.vatRate],
  );

  const update = (i: number, field: keyof BuilderLine, value: string) =>
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    );

  const save = () => {
    setMsg(null);
    startSave(async () => {
      const r = await saveRevisionAction(props.revisionId, props.quotationId, {
        lines,
        discountPct: n(discountPct),
        validUntil,
        notes,
      });
      if (r.ok) {
        setMsg("Saved");
        router.refresh();
      } else {
        setMsg(r.error ?? "Save failed");
      }
    });
  };

  const cellInput =
    "h-7 w-full rounded border border-input bg-card px-1.5 text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-ring/50";
  const numCell = `${cellInput} text-right font-mono tabular-nums`;

  return (
    <div className="space-y-4">
      {/* BOQ table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2 font-medium">Section</th>
              <th className="px-2 py-2 font-medium">Description</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Unit</th>
              {props.canViewCost && (
                <>
                  <th className="px-2 py-2 text-right font-medium">Material</th>
                  <th className="px-2 py-2 text-right font-medium">Labor</th>
                  <th className="px-2 py-2 text-right font-medium">Eng.</th>
                  <th className="px-2 py-2 text-right font-medium">Sub.</th>
                  <th className="px-2 py-2 text-right font-medium">Mu%</th>
                </>
              )}
              <th className="px-2 py-2 text-right font-medium">Unit Price</th>
              <th className="px-2 py-2 text-right font-medium">Amount</th>
              {props.editable && <th className="px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const lt = calcLineTotals({
                qty: n(l.qty),
                materialUnitCost: n(l.materialUnitCost),
                laborUnitCost: n(l.laborUnitCost),
                engineeringUnitCost: n(l.engineeringUnitCost),
                subcontractorUnitCost: n(l.subcontractorUnitCost),
                markupPct: n(l.markupPct),
              });
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">
                    {props.editable ? (
                      <input
                        className={`${cellInput} w-24`}
                        value={l.sectionTitle}
                        onChange={(e) =>
                          update(i, "sectionTitle", e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        {l.sectionTitle}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {props.editable ? (
                      <input
                        className={`${cellInput} min-w-[180px]`}
                        value={l.description}
                        placeholder="Item description"
                        onChange={(e) =>
                          update(i, "description", e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-[13px]">{l.description}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {props.editable ? (
                      <input
                        type="number"
                        className={`${numCell} w-16`}
                        value={l.qty}
                        onChange={(e) => update(i, "qty", e.target.value)}
                      />
                    ) : (
                      <div className="text-right font-mono text-[12px]">
                        {Number(l.qty)}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {props.editable ? (
                      <select
                        className={`${cellInput} w-16`}
                        value={l.unit}
                        onChange={(e) => update(i, "unit", e.target.value)}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[12px] text-muted-foreground">
                        {l.unit}
                      </div>
                    )}
                  </td>
                  {props.canViewCost && (
                    <>
                      {(
                        [
                          "materialUnitCost",
                          "laborUnitCost",
                          "engineeringUnitCost",
                          "subcontractorUnitCost",
                          "markupPct",
                        ] as (keyof BuilderLine)[]
                      ).map((f) => (
                        <td key={f} className="px-2 py-1.5">
                          {props.editable ? (
                            <input
                              type="number"
                              className={`${numCell} w-20`}
                              value={l[f]}
                              onChange={(e) => update(i, f, e.target.value)}
                            />
                          ) : (
                            <div className="text-right font-mono text-[12px]">
                              {Number(l[f])}
                            </div>
                          )}
                        </td>
                      ))}
                    </>
                  )}
                  <td className="px-2 py-1.5 text-right font-mono text-[12px] tabular-nums">
                    {formatAED(lt.unitPrice)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[12px] font-semibold tabular-nums">
                    {formatAED(lt.lineTotal)}
                  </td>
                  {props.editable && (
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        aria-label="Remove line"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No line items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {props.editable && (
        <button
          type="button"
          onClick={() =>
            setLines((p) => [...p, blankLine(p[p.length - 1]?.sectionTitle)])
          }
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-3.5" /> Add line
        </button>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Discount + validity + notes */}
        <div className="space-y-3">
          {props.editable && (
            <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Discount %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="mt-1 h-9 w-24 rounded-md border border-input bg-card px-3 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Valid until
                </span>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 h-9 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              {n(discountPct) > 5 && (
                <p className="text-[11px] text-warning">
                  Discounts above 5% require management approval.
                </p>
              )}
            </div>
          )}
          {props.editable && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes / terms shown on the quotation…"
              className="min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          )}
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-border bg-card p-4">
          {props.canViewCost && (
            <div className="mb-3 space-y-1 border-b border-border pb-3 font-mono text-[11px] text-muted-foreground">
              <Row k="Material" v={formatAED(totals.materialCost)} />
              <Row k="Labor" v={formatAED(totals.laborCost)} />
              <Row k="Engineering" v={formatAED(totals.engineeringCost)} />
              <Row k="Subcontractor" v={formatAED(totals.subcontractorCost)} />
              <Row k="Total cost" v={formatAED(totals.totalCost)} strong />
            </div>
          )}
          <div className="space-y-1 text-sm">
            <Row k="Subtotal" v={formatAED(totals.subtotal)} />
            {totals.discountAmount > 0 && (
              <Row
                k={`Discount (${n(discountPct)}%)`}
                v={`-${formatAED(totals.discountAmount)}`}
              />
            )}
            <Row
              k={`VAT (${(props.vatRate * 100).toFixed(0)}%)`}
              v={formatAED(totals.vatAmount)}
            />
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums">
                {formatAED(totals.grandTotal)}
              </span>
            </div>
            {props.canViewCost && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-brand-weak/50 px-2 py-1.5 font-mono text-[12px]">
                <span className="text-muted-foreground">Margin</span>
                <span
                  className={
                    totals.marginPct >= 20
                      ? "text-success"
                      : totals.marginPct >= 10
                        ? "text-warning"
                        : "text-danger"
                  }
                >
                  {formatAED(totals.marginAmount)} · {totals.marginPct}%
                </span>
              </div>
            )}
          </div>

          {props.editable && (
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? (
                  "Saving…"
                ) : msg === "Saved" ? (
                  <>
                    <Check className="size-4" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Save quotation
                  </>
                )}
              </Button>
            </div>
          )}
          {msg && msg !== "Saved" && (
            <p className="mt-2 text-[12px] text-danger">{msg}</p>
          )}
        </div>
      </div>
    </div>
  );

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-foreground" : ""}>{k}</span>
      <span
        className={`font-mono tabular-nums ${strong ? "font-semibold text-foreground" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}
