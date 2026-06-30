/** Currency + number formatting (org currency defaults to AED). */
export function formatAED(
  v: string | number | null | undefined,
  opts?: { compact?: boolean },
): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: opts?.compact ? 1 : 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(n);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
