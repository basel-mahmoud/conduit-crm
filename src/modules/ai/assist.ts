import { and, eq, getTableColumns, isNull } from "drizzle-orm";

import { db } from "@/db";
import { accounts, activityEvents, leads, opportunities } from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { callModel, extractJson } from "@/server/ai/gateway";
import { requirePermission, type AuthContext } from "@/server/rbac/guard";
import { STAGE_META, type OppStageKey } from "@/modules/opportunities/labels";
import {
  LEAD_STATUS_LABELS,
  type LeadStatusKey,
} from "@/modules/leads/labels";
import { PROJECT_TYPE_LABELS } from "@/modules/shared/project-types";
import { formatAED } from "@/lib/format";

const SYSTEM =
  "You are a senior sales engineer at a systems-integration company (BMS, LCS, EMS, HVAC controls, ELV). Be concise, practical and specific to building-controls contracting. Never invent facts that are not in the provided context.";

export interface OppAssist {
  score: number;
  rationale: string;
  nextAction: string;
  email: string;
  source: "gemini" | "heuristic";
}

export interface LeadAssist {
  recommendation: string;
  nextAction: string;
  email: string;
  source: "gemini" | "heuristic";
}

/* ------------------------------- Opportunity ------------------------------ */

const OPP_NEXT: Record<OppStageKey, string> = {
  new: "Qualify the enquiry — confirm budget, decision-maker and timeline.",
  qualified: "Prepare and issue a budgetary offer.",
  budgetary: "Develop the technical submission and compliance sheets.",
  technical: "Issue the commercial offer once the technical is approved.",
  commercial: "Chase consultant/contractor approvals and hold a review.",
  negotiation: "Resolve commercial terms and push to secure the PO.",
  awaiting_po: "Confirm PO issuance and prepare project registration.",
  won: "Register the project and mobilise the delivery team.",
  lost: "Log the lost reason and nurture the account for future work.",
};

type OppRow = typeof opportunities.$inferSelect & { accountName: string | null };

function heuristicOpp(o: OppRow): OppAssist {
  let score = o.probability;
  const factors: string[] = [];
  if (o.consultantApproval === "approved") {
    score += 8;
    factors.push("consultant approved");
  }
  if (o.contractorApproval === "approved") {
    score += 8;
    factors.push("contractor approved");
  }
  if (o.consultantApproval === "rejected" || o.contractorApproval === "rejected") {
    score -= 20;
    factors.push("an approval was rejected");
  }
  if (Number(o.value ?? 0) >= 1_000_000) score += 4;
  if (o.expectedCloseDate && new Date(o.expectedCloseDate) < new Date()) {
    score -= 12;
    factors.push("expected close date has passed");
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const health =
    score >= 70
      ? "Strong position — protect momentum."
      : score >= 40
        ? "Moderate — de-risk approvals and the timeline."
        : "At risk — needs attention or re-qualification.";
  const rationale = `At ${STAGE_META[o.stage].label} with ${o.probability}% probability and ${formatAED(o.value)} value${factors.length ? "; " + factors.join(", ") : ""}. ${health}`;
  const email = `Dear ${o.accountName ?? "team"},\n\nThank you for the opportunity on ${o.name}. We're making good progress and would like to align on the next steps${o.expectedCloseDate ? ` ahead of the target date of ${o.expectedCloseDate}` : ""}. Could we schedule a short call this week to review scope and confirm the path to award?\n\nOur ${PROJECT_TYPE_LABELS[o.projectType]} solution is well matched to your requirements, and we remain at your disposal for any clarifications.\n\nKind regards,\nConduit`;
  return { score, rationale, nextAction: OPP_NEXT[o.stage], email, source: "heuristic" };
}

export async function aiOpportunityAssist(
  ctx: AuthContext,
  oppId: string,
): Promise<OppAssist> {
  requirePermission(ctx, "opportunity.read");
  const [opp] = await db
    .select({ ...getTableColumns(opportunities), accountName: accounts.name })
    .from(opportunities)
    .leftJoin(accounts, eq(accounts.id, opportunities.accountId))
    .where(
      and(
        eq(opportunities.id, oppId),
        eq(opportunities.orgId, ctx.orgId),
        isNull(opportunities.deletedAt),
      ),
    )
    .limit(1);
  if (!opp) throw new Error("Opportunity not found");

  const result = heuristicOpp(opp);

  const prompt = `Opportunity context:
- Name: ${opp.name}
- Customer: ${opp.accountName ?? "n/a"}
- System type: ${PROJECT_TYPE_LABELS[opp.projectType]}
- Stage: ${STAGE_META[opp.stage].label}
- Win probability: ${opp.probability}%
- Value: ${formatAED(opp.value)}
- Consultant approval: ${opp.consultantApproval}
- Contractor approval: ${opp.contractorApproval}
- Expected close: ${opp.expectedCloseDate ?? "n/a"}
- Competitor: ${opp.competitor ?? "n/a"}

Return STRICT JSON only: {"nextAction":"one concrete next step (<=160 chars)","rationale":"2-3 sentences on deal health and key risks","email":"a short professional follow-up email to the customer (<=140 words), no placeholders or brackets"}`;
  const raw = await callModel(SYSTEM, prompt);
  if (raw) {
    const parsed = extractJson<{
      nextAction?: string;
      rationale?: string;
      email?: string;
    }>(raw);
    if (parsed?.nextAction && parsed?.email) {
      result.nextAction = parsed.nextAction;
      result.rationale = parsed.rationale ?? result.rationale;
      result.email = parsed.email;
      result.source = "gemini";
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "opportunity",
      subjectId: oppId,
      type: "ai_assist",
      actorId: ctx.userId,
      payload: { source: result.source },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ai.assist",
      resource: "opportunity",
      resourceId: oppId,
      metadata: { feature: "opportunity_assist", source: result.source },
    });
  });

  return result;
}

/* ---------------------------------- Lead ---------------------------------- */

const LEAD_REC: Record<LeadStatusKey, { rec: string; next: string }> = {
  new: {
    rec: "Fresh enquiry — qualify against BANT (budget, authority, need, timeline) before investing effort.",
    next: "Make first contact and confirm the project scope and budget.",
  },
  contacted: {
    rec: "Engaged but unqualified — establish the technical fit and decision process.",
    next: "Schedule a technical discovery call with the consultant/end-user.",
  },
  qualified: {
    rec: "Qualified and ready — convert to an opportunity and start the offer.",
    next: "Convert to an opportunity and prepare a budgetary offer.",
  },
  unqualified: {
    rec: "Not a current fit — nurture and revisit when timing improves.",
    next: "Add to the nurture list and set a follow-up reminder.",
  },
  converted: {
    rec: "Already converted — track progress on the linked opportunity.",
    next: "Open the opportunity and drive it through the pipeline.",
  },
};

type LeadRow = typeof leads.$inferSelect & { accountName: string | null };

function heuristicLead(l: LeadRow): LeadAssist {
  const { rec, next } = LEAD_REC[l.status];
  const email = `Dear ${l.accountName ?? "team"},\n\nThank you for your interest regarding ${l.projectName}. As specialists in ${PROJECT_TYPE_LABELS[l.projectType]} for building-services projects, we'd welcome the chance to understand your requirements in more detail.\n\nWould you be available for a brief call this week? We can then advise on the best approach and prepare an indicative proposal.\n\nKind regards,\nConduit`;
  return { recommendation: rec, nextAction: next, email, source: "heuristic" };
}

export async function aiLeadAssist(
  ctx: AuthContext,
  leadId: string,
): Promise<LeadAssist> {
  requirePermission(ctx, "lead.read");
  const [lead] = await db
    .select({ ...getTableColumns(leads), accountName: accounts.name })
    .from(leads)
    .leftJoin(accounts, eq(accounts.id, leads.accountId))
    .where(
      and(
        eq(leads.id, leadId),
        eq(leads.orgId, ctx.orgId),
        isNull(leads.deletedAt),
      ),
    )
    .limit(1);
  if (!lead) throw new Error("Lead not found");

  const result = heuristicLead(lead);

  const prompt = `Lead context:
- Project: ${lead.projectName}
- Customer: ${lead.accountName ?? "n/a"}
- System type: ${PROJECT_TYPE_LABELS[lead.projectType]}
- Status: ${LEAD_STATUS_LABELS[lead.status]}
- Estimated value: ${formatAED(lead.estValue)}
- Location: ${lead.projectLocation ?? "n/a"}

Return STRICT JSON only: {"recommendation":"1-2 sentence assessment and strategy","nextAction":"one concrete next step (<=160 chars)","email":"a short professional outreach email (<=130 words), no placeholders or brackets"}`;
  const raw = await callModel(SYSTEM, prompt);
  if (raw) {
    const parsed = extractJson<{
      recommendation?: string;
      nextAction?: string;
      email?: string;
    }>(raw);
    if (parsed?.nextAction && parsed?.email) {
      result.recommendation = parsed.recommendation ?? result.recommendation;
      result.nextAction = parsed.nextAction;
      result.email = parsed.email;
      result.source = "gemini";
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "lead",
      subjectId: leadId,
      type: "ai_assist",
      actorId: ctx.userId,
      payload: { source: result.source },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "ai.assist",
      resource: "lead",
      resourceId: leadId,
      metadata: { feature: "lead_assist", source: result.source },
    });
  });

  return result;
}
