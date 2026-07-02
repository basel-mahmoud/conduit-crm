import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/context";
import { rateLimit } from "@/server/rate-limit";
import { notificationsFor } from "@/server/notifications/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`notif:${ctx.userId}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const items = await notificationsFor(ctx);
  return NextResponse.json({ items });
}
