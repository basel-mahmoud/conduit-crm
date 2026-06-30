import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";

import { QuotationPdf } from "@/modules/quotations/pdf";
import { getQuotationFull } from "@/modules/quotations/service";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const auth = await requireAuthContext();
  const data = await getQuotationFull(auth, id);
  if (!data) return new Response("Not found", { status: 404 });

  const element = createElement(QuotationPdf, {
    data,
  }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.quotation.number}.pdf"`,
    },
  });
}
