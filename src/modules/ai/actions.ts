"use server";

import { requireAuthContext } from "@/server/auth/context";
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
  try {
    return await aiLeadAssist(ctx, leadId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI assist failed." };
  }
}
