import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  PROJECT_TYPE_LABELS,
  type ProjectTypeKey,
} from "../shared/project-types";
import type { getQuotationFull } from "./service";

type Data = NonNullable<Awaited<ReturnType<typeof getQuotationFull>>>;

const fmt = (v: string | number | null | undefined) =>
  Number(v ?? 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#14171a" },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e63e9",
    paddingBottom: 10,
  },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1e63e9" },
  brandSub: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  meta: { fontSize: 8, color: "#6b7280", textAlign: "right", marginTop: 2 },
  section: { marginTop: 16 },
  label: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  h: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f3f3ef",
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d6d6ce",
  },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#3b4148",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e6e6e0",
  },
  cDesc: { width: "46%" },
  cQty: { width: "10%", textAlign: "right" },
  cUnit: { width: "10%", textAlign: "center" },
  cPrice: { width: "17%", textAlign: "right" },
  cAmt: { width: "17%", textAlign: "right" },
  sectionRow: {
    backgroundColor: "#fafaf8",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  sectionText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#3b4148" },
  totals: { marginTop: 14, marginLeft: "55%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#14171a",
  },
  grandText: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e6e6e0",
    paddingTop: 6,
  },
});

export function QuotationPdf({ data }: { data: Data }) {
  const { quotation: q, current, lines } = data;

  const sections: { title: string; items: typeof lines }[] = [];
  for (const l of lines) {
    let s = sections.find((x) => x.title === l.sectionTitle);
    if (!s) {
      s = { title: l.sectionTitle, items: [] };
      sections.push(s);
    }
    s.items.push(l);
  }

  return (
    <Document title={q.number}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>Conduit</Text>
            <Text style={styles.brandSub}>
              Systems Integration · BMS · LCS · EMS · HVAC Controls
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>QUOTATION</Text>
            <Text style={styles.meta}>{q.number}</Text>
            <Text style={styles.meta}>
              {new Date().toLocaleDateString("en-GB")}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.section,
            { flexDirection: "row", justifyContent: "space-between" },
          ]}
        >
          <View style={{ width: "55%" }}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.h}>{q.accountName ?? "—"}</Text>
          </View>
          <View style={{ width: "40%" }}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.h}>{q.title}</Text>
            <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>
              {PROJECT_TYPE_LABELS[q.projectType as ProjectTypeKey]}
              {current?.validUntil ? ` · Valid until ${current.validUntil}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.cDesc]}>Description</Text>
          <Text style={[styles.th, styles.cQty]}>Qty</Text>
          <Text style={[styles.th, styles.cUnit]}>Unit</Text>
          <Text style={[styles.th, styles.cPrice]}>Unit Price</Text>
          <Text style={[styles.th, styles.cAmt]}>Amount</Text>
        </View>

        {sections.map((s) => (
          <View key={s.title} wrap={false}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionText}>{s.title}</Text>
            </View>
            {s.items.map((l) => (
              <View key={l.id} style={styles.row}>
                <Text style={styles.cDesc}>{l.description}</Text>
                <Text style={styles.cQty}>{Number(l.qty)}</Text>
                <Text style={styles.cUnit}>{l.unit}</Text>
                <Text style={styles.cPrice}>{fmt(l.unitPrice)}</Text>
                <Text style={styles.cAmt}>{fmt(l.lineTotal)}</Text>
              </View>
            ))}
          </View>
        ))}

        {lines.length === 0 && (
          <View style={styles.row}>
            <Text style={{ color: "#6b7280" }}>No line items yet.</Text>
          </View>
        )}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmt(current?.subtotal)}</Text>
          </View>
          {Number(current?.discountAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount ({Number(current?.discountPct)}%)</Text>
              <Text>-{fmt(current?.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>VAT ({(Number(current?.vatRate) * 100).toFixed(0)}%)</Text>
            <Text>{fmt(current?.vatAmount)}</Text>
          </View>
          <View style={styles.grand}>
            <Text style={styles.grandText}>Grand Total (AED)</Text>
            <Text style={styles.grandText}>{fmt(current?.grandTotal)}</Text>
          </View>
        </View>

        {current?.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={{ marginTop: 3, color: "#3b4148" }}>
              {current.notes}
            </Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Conduit CRM · system-generated · prices in AED, exclusive unless stated
        </Text>
      </Page>
    </Document>
  );
}
