/**
 * Drizzle client over the Neon serverless (WebSocket Pool) driver.
 *
 * The Pool/WebSocket driver — not neon-http — is used deliberately: it supports
 * interactive transactions, which the audit hash-chain and number-sequence
 * allocation require (read-then-write inside one atomic transaction).
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Node (local + Vercel Node runtime) needs an explicit WebSocket constructor.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema, casing: "snake_case" });
export type DB = typeof db;

/** Drizzle transaction handle (same query surface as `db`). */
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export { schema };
