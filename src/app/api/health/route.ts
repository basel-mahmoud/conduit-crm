import { sql } from "drizzle-orm";

import { db } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    time: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    status: dbOk ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
