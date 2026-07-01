import Link from "next/link";
import { FileText, Search, Download } from "lucide-react";

import { formatAED, formatDate } from "@/lib/format";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_TONE,
  type QuotationStatusKey,
} from "@/modules/quotations/labels";
import { listQuotations } from "@/modules/quotations/service";
import { requireAuthContext } from "@/server/auth/context";
import { can } from "@/server/rbac/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documents" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAuthContext();

  if (!can(ctx, "quotation.read")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to view documents.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const quotes = await listQuotations(ctx, { q });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Document register
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every customer-facing document the system generates. Quotation PDFs are
          produced on demand and always reflect the current revision.
        </p>
      </div>

      {/* Search */}
      <form className="mt-5 flex items-center gap-2" action="/documents">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by number or title…"
            className="h-9 w-full rounded-md bg-muted/40 pl-9 pr-3 text-sm ring-hairline outline-none transition-colors focus:ring-1 focus:ring-primary"
          />
        </div>
      </form>

      <section className="mt-4 rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="size-4 text-primary" /> Quotations
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {quotes.length} document{quotes.length === 1 ? "" : "s"}
          </span>
        </header>

        {quotes.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No documents yet. Create a quotation to generate its PDF.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Number</th>
                  <th className="px-5 py-2 font-medium">Document</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 text-right font-medium">Value</th>
                  <th className="px-5 py-2 font-medium">Updated</th>
                  <th className="px-5 py-2 text-right font-medium">Document</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((doc) => {
                  const status = doc.status as QuotationStatusKey;
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
                        {doc.number}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/quotations/${doc.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {doc.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {doc.accountName ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${QUOTATION_STATUS_TONE[status]}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {QUOTATION_STATUS_LABELS[status] ?? doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12.5px]">
                        {formatAED(doc.grandTotal)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(doc.updatedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={`/quotations/${doc.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-primary ring-hairline transition-colors hover:bg-brand-weak"
                        >
                          <Download className="size-3.5" /> PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
