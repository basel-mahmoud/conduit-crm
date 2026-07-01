"use server";

import { requireAuthContext } from "@/server/auth/context";
import { rateLimit } from "@/server/rate-limit";
import {
  aiLeadAssist,
  aiOpportunityAssist,
  type LeadAssist,
  type OppAssist,
} from "./assist";

export async function opportunityAssistAction(
  oppId: string,
): Promise<OppAssist | { error: string }> {
  const ctx = await requireAuthContext();
  const rl = rateLimit(`ai:${ctx.userId}`, 15, 60_000);
  if (!rl.ok)
    return { error: `Too many AI requests — retry in ${rl.retryAfter}s.` };
  try {
    return await aiOpportunityAssist(ctx, oppId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI assist failed." };
  }
}

export async function leadAssistAction(
  leadId: string,
): Promise<LeadAssist | { error: string }> {
  const ctx = await requireAuthContext();
  const rl = rateLimit(`ai:${ctx.userId}`, 15, 60_000);
  if (!rl.ok)
    return { error: `Too many AI requests — retry in ${rl.retryAfter}s.` };
  try {
    return await aiLeadAssist(ctx, leadId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI assist failed." };
  }
}
