/**
 * Database seed — idempotent. Safe to re-run.
 *
 * Seeds: the Conduit organization, the permission catalog, the 11 system roles
 * with their grants, an owner/admin user (used by the dev-auth fallback until
 * Clerk is wired), and the document-number sequences.
 */
import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  accounts,
  contacts,
  leads,
  numberSequences,
  opportunities,
  organizations,
  permissions,
  projectMilestones,
  projectPhases,
  projects,
  quotationLines,
  quotationRevisions,
  quotations,
  rolePermissions,
  roles,
  snags,
  userRoles,
  users,
} from "@/db/schema";
import type { NewLead, NewOpportunity } from "@/db/schema";
import { PERMISSION_DEFS, permissionDescription } from "@/server/rbac/permissions";
import { SYSTEM_ROLES } from "@/server/rbac/roles";
import type { AccountTypeKey, RatingKey } from "@/modules/accounts/labels";
import { STAGE_META, type OppStageKey } from "@/modules/opportunities/labels";
import { calcLineTotals, calcQuotation } from "@/modules/quotations/calc";
import {
  PHASE_KINDS,
  type PhaseKindKey,
  type PhaseStatusKey,
} from "@/modules/projects/labels";

const ORG = { name: "Conduit", slug: "conduit", currency: "AED" };

const OWNER = {
  id: "usr_dev_owner",
  email: "owner@conduit.local",
  firstName: "Basel",
  lastName: "Mahmoud",
};

const SEQUENCES: { kind: string; prefix: string; padding: number }[] = [
  { kind: "lead", prefix: "LEAD-", padding: 4 },
  { kind: "opportunity", prefix: "OPP-", padding: 4 },
  { kind: "quotation", prefix: "QT-2026-", padding: 4 },
  { kind: "project", prefix: "PRJ-", padding: 4 },
  { kind: "contract", prefix: "AMC-", padding: 4 },
  { kind: "ticket", prefix: "TKT-2026-", padding: 4 },
  { kind: "po", prefix: "PO-2026-", padding: 4 },
];

async function main() {
  // 1. Organization
  await db
    .insert(organizations)
    .values(ORG)
    .onConflictDoNothing({ target: organizations.slug });
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, ORG.slug))
    .limit(1);
  if (!org) throw new Error("Failed to create organization");
  console.log(`org: ${org.id}`);

  // 2. Permission catalog (global)
  await db
    .insert(permissions)
    .values(
      PERMISSION_DEFS.map((p) => ({
        key: p.key,
        resource: p.resource,
        action: p.action,
        description: permissionDescription(p),
      })),
    )
    .onConflictDoNothing();
  console.log(`permissions: ${PERMISSION_DEFS.length}`);

  // 3. System roles
  await db
    .insert(roles)
    .values(
      SYSTEM_ROLES.map((r) => ({
        orgId: org.id,
        key: r.key,
        name: r.name,
        description: r.description,
        isSystem: true,
      })),
    )
    .onConflictDoNothing({ target: [roles.orgId, roles.key] });

  const roleRows = await db
    .select({ id: roles.id, key: roles.key })
    .from(roles)
    .where(eq(roles.orgId, org.id));
  const roleIdByKey = new Map(roleRows.map((r) => [r.key, r.id]));
  console.log(`roles: ${roleRows.length}`);

  // 4. Role → permission grants
  const grantRows: {
    roleId: string;
    permissionKey: string;
    scope: "own" | "team" | "branch" | "org";
  }[] = [];
  for (const role of SYSTEM_ROLES) {
    const roleId = roleIdByKey.get(role.key);
    if (!roleId) continue;
    for (const [permissionKey, scope] of Object.entries(role.grants)) {
      grantRows.push({ roleId, permissionKey, scope: scope as "org" });
    }
  }
  if (grantRows.length) {
    await db.insert(rolePermissions).values(grantRows).onConflictDoNothing();
  }
  console.log(`grants: ${grantRows.length}`);

  // 5. Owner / admin user (dev-auth fallback identity)
  await db
    .insert(users)
    .values({
      id: OWNER.id,
      orgId: org.id,
      email: OWNER.email,
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
      status: "active",
    })
    .onConflictDoNothing({ target: users.id });

  const adminRoleId = roleIdByKey.get("admin");
  if (adminRoleId) {
    await db
      .insert(userRoles)
      .values({ userId: OWNER.id, roleId: adminRoleId })
      .onConflictDoNothing();
  }
  console.log(`owner: ${OWNER.id} (admin)`);

  // 6. Document-number sequences
  await db
    .insert(numberSequences)
    .values(SEQUENCES.map((s) => ({ orgId: org.id, ...s })))
    .onConflictDoNothing({
      target: [numberSequences.orgId, numberSequences.kind],
    });
  console.log(`sequences: ${SEQUENCES.length}`);

  // 7. Demo accounts + contacts (only when the org has none yet)
  const [{ c }] = await db
    .select({ c: count() })
    .from(accounts)
    .where(eq(accounts.orgId, org.id));

  if (Number(c) === 0) {
    const demo: {
      name: string;
      type: AccountTypeKey;
      city: string;
      email: string;
      industry: string;
      rating: RatingKey;
      website?: string;
      phone?: string;
    }[] = [
      { name: "Emaar Properties", type: "developer", city: "Dubai", email: "projects@emaar.ae", industry: "Real Estate", rating: "a", website: "emaar.com", phone: "+971 4 366 1688" },
      { name: "Dubai Municipality", type: "end_user", city: "Dubai", email: "info@dm.gov.ae", industry: "Government", rating: "a" },
      { name: "WSP Middle East", type: "consultant", city: "Dubai", email: "mep@wsp.com", industry: "MEP Consultancy", rating: "a", website: "wsp.com" },
      { name: "ALEC Engineering", type: "contractor", city: "Dubai", email: "info@alec.ae", industry: "Main Contractor", rating: "b" },
      { name: "Khansaheb Facilities Management", type: "fm", city: "Dubai", email: "fm@khansaheb.ae", industry: "Facility Management", rating: "b" },
      { name: "Drake & Scull MEP", type: "mep", city: "Abu Dhabi", email: "info@drakescull.com", industry: "MEP Contractor", rating: "c" },
      { name: "Schneider Electric", type: "brand_partner", city: "Dubai", email: "gulf@se.com", industry: "BMS / Controls", rating: "a", website: "se.com" },
      { name: "Honeywell Building Technologies", type: "supplier", city: "Dubai", email: "buildings@honeywell.com", industry: "BMS / Controls", rating: "a", website: "honeywell.com" },
    ];

    const inserted = await db
      .insert(accounts)
      .values(
        demo.map((d) => ({
          ...d,
          orgId: org.id,
          ownerId: OWNER.id,
          createdBy: OWNER.id,
          updatedBy: OWNER.id,
        })),
      )
      .returning({ id: accounts.id });

    await db.insert(contacts).values([
      { orgId: org.id, accountId: inserted[0].id, firstName: "Omar", lastName: "Al Futtaim", title: "Projects Director", email: "omar@emaar.ae", isPrimary: true, createdBy: OWNER.id, updatedBy: OWNER.id },
      { orgId: org.id, accountId: inserted[2].id, firstName: "Sarah", lastName: "Khan", title: "Senior MEP Engineer", email: "sarah.khan@wsp.com", isPrimary: true, createdBy: OWNER.id, updatedBy: OWNER.id },
      { orgId: org.id, accountId: inserted[6].id, firstName: "Rajesh", lastName: "Menon", title: "BMS Specialist", email: "rajesh.menon@se.com", isPrimary: true, createdBy: OWNER.id, updatedBy: OWNER.id },
    ]);

    console.log(`demo accounts: ${inserted.length} (+3 contacts)`);
  } else {
    console.log(`demo accounts: skipped (${c} exist)`);
  }

  // 8. Demo leads + opportunities (only when the org has none yet)
  const [{ lc }] = await db
    .select({ lc: count() })
    .from(leads)
    .where(eq(leads.orgId, org.id));
  if (Number(lc) === 0) {
    const accs = await db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(eq(accounts.orgId, org.id));
    const byName = (n: string) => accs.find((x) => x.name === n)?.id ?? null;

    const demoLeads: Omit<
      NewLead,
      "orgId" | "ownerId" | "createdBy" | "updatedBy"
    >[] = [
      { refNo: "LEAD-0001", source: "tender", status: "new", projectType: "bms", projectName: "Sobha Hartland — BMS tender", projectLocation: "MBR City, Dubai", estValue: "3200000", accountId: null },
      { refNo: "LEAD-0002", source: "referral", status: "contacted", projectType: "hvac_controls", projectName: "Aldar HQ — HVAC controls", projectLocation: "Abu Dhabi", estValue: "1400000", accountId: byName("Dubai Municipality") },
      { refNo: "LEAD-0003", source: "website", status: "qualified", projectType: "lcs", projectName: "JBR Towers — lighting retrofit", projectLocation: "JBR, Dubai", estValue: "760000", accountId: byName("Emaar Properties") },
      { refNo: "LEAD-0004", source: "consultant", status: "new", projectType: "ems", projectName: "Yas Mall — EMS", projectLocation: "Abu Dhabi", estValue: "2900000", accountId: byName("ALEC Engineering") },
    ];
    await db.insert(leads).values(
      demoLeads.map((l) => ({
        ...l,
        orgId: org.id,
        ownerId: OWNER.id,
        createdBy: OWNER.id,
        updatedBy: OWNER.id,
      })),
    );
    await db
      .update(numberSequences)
      .set({ nextVal: demoLeads.length + 1 })
      .where(
        and(eq(numberSequences.orgId, org.id), eq(numberSequences.kind, "lead")),
      );

    const demoOpps: Omit<
      NewOpportunity,
      "orgId" | "ownerId" | "createdBy" | "updatedBy" | "probability"
    >[] = [
      { refNo: "OPP-0001", name: "DIFC Tower 2 — BMS & HVAC controls", stage: "commercial", projectType: "bms", value: "2400000", accountId: byName("Emaar Properties") },
      { refNo: "OPP-0002", name: "Dubai Municipality HQ — EMS upgrade", stage: "technical", projectType: "ems", value: "1150000", accountId: byName("Dubai Municipality") },
      { refNo: "OPP-0003", name: "Bluewaters — BTU metering", stage: "budgetary", projectType: "btu", value: "680000", accountId: byName("ALEC Engineering") },
      { refNo: "OPP-0004", name: "City Walk — lighting control", stage: "negotiation", projectType: "lcs", value: "1950000", accountId: byName("Emaar Properties") },
      { refNo: "OPP-0005", name: "Expo Pavilion — ELV integration", stage: "qualified", projectType: "elv", value: "540000", accountId: byName("Khansaheb Facilities Management") },
      { refNo: "OPP-0006", name: "Palm Villas — home automation", stage: "awaiting_po", projectType: "home_automation", value: "2100000", accountId: byName("Dubai Municipality") },
    ];
    await db.insert(opportunities).values(
      demoOpps.map((o) => ({
        ...o,
        orgId: org.id,
        ownerId: OWNER.id,
        createdBy: OWNER.id,
        updatedBy: OWNER.id,
        probability: STAGE_META[o.stage as OppStageKey].probability,
      })),
    );
    await db
      .update(numberSequences)
      .set({ nextVal: demoOpps.length + 1 })
      .where(
        and(
          eq(numberSequences.orgId, org.id),
          eq(numberSequences.kind, "opportunity"),
        ),
      );

    console.log(
      `demo pipeline: ${demoLeads.length} leads, ${demoOpps.length} opportunities`,
    );
  } else {
    console.log(`demo pipeline: skipped (${lc} leads exist)`);
  }

  // 9. Demo quotation (BOQ from OPP-0001), only when none exist yet
  const [{ qc }] = await db
    .select({ qc: count() })
    .from(quotations)
    .where(eq(quotations.orgId, org.id));
  if (Number(qc) === 0) {
    const [opp] = await db
      .select({
        id: opportunities.id,
        name: opportunities.name,
        accountId: opportunities.accountId,
        projectType: opportunities.projectType,
      })
      .from(opportunities)
      .where(
        and(eq(opportunities.orgId, org.id), eq(opportunities.refNo, "OPP-0001")),
      )
      .limit(1);

    if (opp) {
      const demoLines = [
        { sectionTitle: "BMS Controllers", description: "DDC controller, 32-point (Schneider)", qty: 12, unit: "nos", materialUnitCost: 3200, laborUnitCost: 400, engineeringUnitCost: 150, subcontractorUnitCost: 0, markupPct: 18 },
        { sectionTitle: "BMS Controllers", description: "I/O expansion module, 16-point", qty: 24, unit: "nos", materialUnitCost: 850, laborUnitCost: 120, engineeringUnitCost: 40, subcontractorUnitCost: 0, markupPct: 18 },
        { sectionTitle: "Field Devices", description: "Duct temperature sensor", qty: 60, unit: "nos", materialUnitCost: 180, laborUnitCost: 60, engineeringUnitCost: 0, subcontractorUnitCost: 0, markupPct: 20 },
        { sectionTitle: "Field Devices", description: "Modulating control valve DN50 + actuator", qty: 18, unit: "nos", materialUnitCost: 1100, laborUnitCost: 150, engineeringUnitCost: 0, subcontractorUnitCost: 0, markupPct: 18 },
        { sectionTitle: "Engineering & Commissioning", description: "BMS engineering, graphics & integration", qty: 1, unit: "lot", materialUnitCost: 0, laborUnitCost: 0, engineeringUnitCost: 45000, subcontractorUnitCost: 0, markupPct: 12 },
        { sectionTitle: "Engineering & Commissioning", description: "Testing, commissioning & handover", qty: 1, unit: "lot", materialUnitCost: 0, laborUnitCost: 12000, engineeringUnitCost: 0, subcontractorUnitCost: 28000, markupPct: 12 },
      ];
      const totals = calcQuotation(demoLines, 0, 0.05);
      const m = (v: number) => v.toFixed(2);

      const [q] = await db
        .insert(quotations)
        .values({
          orgId: org.id,
          number: "QT-2026-0001",
          title: opp.name,
          opportunityId: opp.id,
          accountId: opp.accountId,
          projectType: opp.projectType,
          status: "draft",
          ownerId: OWNER.id,
          createdBy: OWNER.id,
          updatedBy: OWNER.id,
        })
        .returning();
      const [rev] = await db
        .insert(quotationRevisions)
        .values({
          orgId: org.id,
          quotationId: q.id,
          revNo: 0,
          status: "draft",
          vatRate: "0.0500",
          materialCost: m(totals.materialCost),
          laborCost: m(totals.laborCost),
          engineeringCost: m(totals.engineeringCost),
          subcontractorCost: m(totals.subcontractorCost),
          totalCost: m(totals.totalCost),
          subtotal: m(totals.subtotal),
          discountAmount: m(totals.discountAmount),
          netSubtotal: m(totals.netSubtotal),
          vatAmount: m(totals.vatAmount),
          grandTotal: m(totals.grandTotal),
          marginAmount: m(totals.marginAmount),
          marginPct: m(totals.marginPct),
          createdBy: OWNER.id,
        })
        .returning();
      await db
        .update(quotations)
        .set({ currentRevisionId: rev.id })
        .where(eq(quotations.id, q.id));
      await db.insert(quotationLines).values(
        demoLines.map((l, i) => {
          const lt = calcLineTotals(l);
          return {
            orgId: org.id,
            revisionId: rev.id,
            sectionTitle: l.sectionTitle,
            sortOrder: i,
            description: l.description,
            qty: String(l.qty),
            unit: l.unit,
            materialUnitCost: m(l.materialUnitCost),
            laborUnitCost: m(l.laborUnitCost),
            engineeringUnitCost: m(l.engineeringUnitCost),
            subcontractorUnitCost: m(l.subcontractorUnitCost),
            markupPct: String(l.markupPct),
            unitPrice: m(lt.unitPrice),
            lineTotal: m(lt.lineTotal),
          };
        }),
      );
      await db
        .update(numberSequences)
        .set({ nextVal: 2 })
        .where(
          and(
            eq(numberSequences.orgId, org.id),
            eq(numberSequences.kind, "quotation"),
          ),
        );
      console.log(
        `demo quotation: QT-2026-0001 (${demoLines.length} lines, grand ${totals.grandTotal})`,
      );
    }
  } else {
    console.log(`demo quotation: skipped (${qc} exist)`);
  }

  // 10. Demo project (registered from QT-2026-0001), only when none exist yet
  const [{ pc }] = await db
    .select({ pc: count() })
    .from(projects)
    .where(eq(projects.orgId, org.id));
  if (Number(pc) === 0) {
    const [quote] = await db
      .select({
        id: quotations.id,
        title: quotations.title,
        accountId: quotations.accountId,
        projectType: quotations.projectType,
        currentRevisionId: quotations.currentRevisionId,
        opportunityId: quotations.opportunityId,
      })
      .from(quotations)
      .where(
        and(eq(quotations.orgId, org.id), eq(quotations.number, "QT-2026-0001")),
      )
      .limit(1);

    if (quote) {
      let contractValue: string | null = null;
      if (quote.currentRevisionId) {
        const [rev] = await db
          .select({ g: quotationRevisions.grandTotal })
          .from(quotationRevisions)
          .where(eq(quotationRevisions.id, quote.currentRevisionId))
          .limit(1);
        contractValue = rev?.g ?? null;
      }

      const [proj] = await db
        .insert(projects)
        .values({
          orgId: org.id,
          code: "PRJ-0001",
          name: quote.title,
          quotationId: quote.id,
          opportunityId: quote.opportunityId,
          accountId: quote.accountId,
          projectType: quote.projectType,
          contractValue,
          status: "in_progress",
          health: "on_track",
          pmId: OWNER.id,
          location: "DIFC, Dubai",
          ownerId: OWNER.id,
          createdBy: OWNER.id,
          updatedBy: OWNER.id,
        })
        .returning();

      const prog: Record<PhaseKindKey, [PhaseStatusKey, number]> = {
        procurement: ["completed", 100],
        engineering: ["in_progress", 70],
        installation: ["in_progress", 30],
        testing_commissioning: ["not_started", 0],
        handover: ["not_started", 0],
      };
      await db.insert(projectPhases).values(
        PHASE_KINDS.map((kind, i) => {
          const [st, pr] = prog[kind];
          return {
            orgId: org.id,
            projectId: proj.id,
            kind,
            sortOrder: i,
            status: st,
            progressPct: pr,
            startedAt: pr > 0 ? new Date() : null,
            completedAt: pr === 100 ? new Date() : null,
          };
        }),
      );
      await db.insert(projectMilestones).values([
        { orgId: org.id, projectId: proj.id, title: "Material delivery to site", dueDate: "2026-07-20", status: "done", completedAt: new Date(), sortOrder: 0 },
        { orgId: org.id, projectId: proj.id, title: "Controllers installed & powered", dueDate: "2026-08-15", sortOrder: 1 },
        { orgId: org.id, projectId: proj.id, title: "System integration complete", dueDate: "2026-09-10", sortOrder: 2 },
      ]);
      await db.insert(snags).values([
        { orgId: org.id, projectId: proj.id, title: "AHU-3 duct sensor reading drift (+2°C)", severity: "medium", status: "open", raisedBy: OWNER.id, createdBy: OWNER.id, updatedBy: OWNER.id },
        { orgId: org.id, projectId: proj.id, title: "Panel labelling incomplete — Level 4", severity: "low", status: "in_progress", raisedBy: OWNER.id, createdBy: OWNER.id, updatedBy: OWNER.id },
      ]);
      await db
        .update(numberSequences)
        .set({ nextVal: 2 })
        .where(
          and(
            eq(numberSequences.orgId, org.id),
            eq(numberSequences.kind, "project"),
          ),
        );
      console.log("demo project: PRJ-0001 (5 phases, 3 milestones, 2 snags)");
    }
  } else {
    console.log(`demo project: skipped (${pc} exist)`);
  }

  console.log("✓ seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
