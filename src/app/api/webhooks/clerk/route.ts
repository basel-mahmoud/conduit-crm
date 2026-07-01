/**
 * Clerk webhook — keeps the local `users` table in sync with Clerk.
 * Signature is verified (Svix) via `verifyWebhook`, using CLERK_WEBHOOK_SIGNING_SECRET.
 */
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { deleteClerkUser, syncClerkUser } from "@/server/auth/sync";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const evt = await verifyWebhook(req);

    switch (evt.type) {
      case "user.created":
      case "user.updated":
        await syncClerkUser(evt.data);
        break;
      case "user.deleted":
        if (evt.data.id) await deleteClerkUser(evt.data.id);
        break;
      default:
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    return new Response("Webhook verification failed", { status: 400 });
  }
}
