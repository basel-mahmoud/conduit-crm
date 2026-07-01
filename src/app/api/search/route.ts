import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/context";
import { rateLimit } from "@/server/rate-limit";
import { globalSearch } from "@/server/search/global";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`search:${ctx.userId}`, 30, 10_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ groups: [] });

  const groups = await globalSearch(ctx, q.slice(0, 80));
  return NextResponse.json({ groups });
}
