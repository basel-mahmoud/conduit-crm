import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db, type Transaction } from "@/db";
import {
  accounts,
  activityEvents,
  projectMilestones,
  projectPhases,
  projects,
  quotationRevisions,
  quotations,
  snags,
  users,
} from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import {
  requirePermission,
  scopeOf,
  type AuthContext,
} from "@/server/rbac/guard";
import { PHASE_KINDS, type SnagStatusKey } from "./labels";
import type {
  MilestoneInput,
  PhasesInput,
  ProjectInput,
  SnagInput,
} from "./schema";

const toNum = (v: number | undefined) => (v == null ? null : String(v));

async function seedPhases(
  tx: Transaction,
  orgId: string,
  projectId: string,
) {
  await tx.insert(projectPhases).values(
    PHASE_KINDS.map((kind, i) => ({ orgId, projectId, kind, sortOrder: i })),
  );
}

export interface ProjectFilters {
  q?: string;
  status?: string;
}

export async function listProjects(
  ctx: AuthContext,
  filters: ProjectFilters = {},
) {
  requirePermission(ctx, "project.read");
  const conds: SQL[] = [
    eq(projects.orgId, ctx.orgId),
    isNull(projects.deletedAt),
  ];
  if (scopeOf(ctx, "project.read") === "own")
    conds.push(eq(projects.pmId, ctx.userId));
  if (filters.status)
    conds.push(eq(projects.status, filters.status as ProjectInput["status"]));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(ilike(projects.name, term), ilike(projects.code, term)) as SQL,
    );
  }

  const rows = await db
    .select({ ...getTableColumns(projects), accountName: accounts.name })
    .from(projects)
    .leftJoin(accounts, eq(accounts.id, projects.accountId))
    .where(and(...conds))
    .orderBy(desc(projects.createdAt))
    .limit(200);
  if (rows.length === 0) return [];

  const progress = await db
    .select({
      projectId: projectPhases.projectId,
      avg: sql<number>`round(avg(${projectPhases.progressPct}))`,
    })
    .from(projectPhases)
    .where(
      and(
        eq(projectPhases.orgId, ctx.orgId),
        inArray(
          projectPhases.projectId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .groupBy(projectPhases.projectId);
  const byId = new Map(progress.map((p) => [p.projectId, Number(p.avg)]));
  return rows.map((r) => ({ ...r, progress: byId.get(r.id) ?? 0 }));
}

export async function getProjectFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "project.read");
  const [project] = await db
    .select({ ...getTableColumns(projects), accountName: accounts.name })
    .from(projects)
    .leftJoin(accounts, eq(accounts.id, projects.accountId))
    .where(
      and(
        eq(projects.id, id),
        eq(projects.orgId, ctx.orgId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);
  if (!project) return null;
  if (scopeOf(ctx, "project.read") === "own" && project.pmId !== ctx.userId)
    return null;

  const [phases, milestones, projectSnags] = await Promise.all([
    db
      .select()
      .from(projectPhases)
      .where(eq(projectPhases.projectId, id))
      .orderBy(asc(projectPhases.sortOrder)),
    db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id))
      .orderBy(asc(projectMilestones.sortOrder), asc(projectMilestones.dueDate)),
    db
      .select()
      .from(snags)
      .where(and(eq(snags.projectId, id), isNull(snags.deletedAt)))
      .orderBy(desc(snags.createdAt)),
  ]);

  const ids = [project.pmId, project.siteEngineerId].filter(
    (x): x is string => !!x,
  );
  const people = ids.length
    ? await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(inArray(users.id, ids))
    : [];
  const nameOf = (uid: string | null) => {
    if (!uid) return null;
    const u = people.find((p) => p.id === uid);
    if (!u) return null;
    return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
  };

  const progress = phases.length
    ? Math.round(
        phases.reduce((a, p) => a + p.progressPct, 0) / phases.length,
      )
    : 0;

  return {
    project,
    phases,
    milestones,
    snags: projectSnags,
    pmName: nameOf(project.pmId),
    siteEngineerName: nameOf(project.siteEngineerId),
    progress,
  };
}

export async function createProjectFromQuotation(
  ctx: AuthContext,
  quotationId: string,
) {
  requirePermission(ctx, "project.create");
  return db.transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), eq(quotations.orgId, ctx.orgId)))
      .limit(1);
    if (!q) throw new Error("Quotation not found");

    let contractValue: string | null = null;
    if (q.currentRevisionId) {
      const [rev] = await tx
        .select({ grandTotal: quotationRevisions.grandTotal })
        .from(quotationRevisions)
        .where(eq(quotationRevisions.id, q.currentRevisionId))
        .limit(1);
      contractValue = rev?.grandTotal ?? null;
    }

    const { formatted } = await allocateNumber(tx, ctx.orgId, "project");
    const [project] = await tx
      .insert(projects)
      .values({
        orgId: ctx.orgId,
        code: formatted,
        name: q.title,
        quotationId: q.id,
        opportunityId: q.opportunityId,
        accountId: q.accountId,
        projectType: q.projectType,
        contractValue,
        status: "registered",
        pmId: ctx.userId,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await seedPhases(tx, ctx.orgId, project.id);

    // Award implies the quotation is won.
    if (q.status !== "won") {
      await tx
        .update(quotations)
        .set({ status: "won", updatedBy: ctx.userId, updatedAt: new Date() })
        .where(eq(quotations.id, q.id));
    }

    await tx.insert(activityEvents).values([
      {
        orgId: ctx.orgId,
        subjectType: "project",
        subjectId: project.id,
        type: "created",
        actorId: ctx.userId,
        payload: { code: project.code, fromQuotation: q.number },
      },
      {
        orgId: ctx.orgId,
        subjectType: "quotation",
        subjectId: q.id,
        type: "project_registered",
        actorId: ctx.userId,
        payload: { code: project.code },
      },
    ]);
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "project.create",
      resource: "project",
      resourceId: project.id,
      after: project,
    });
    return project;
  });
}

export async function createProject(ctx: AuthContext, input: ProjectInput) {
  requirePermission(ctx, "project.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "project");
    const [project] = await tx
      .insert(projects)
      .values({
        orgId: ctx.orgId,
        code: formatted,
        name: input.name,
        projectType: input.projectType,
        accountId: input.accountId ?? null,
        contractValue: toNum(input.contractValue),
        status: input.status,
        health: input.health,
        pmId: input.pmId || ctx.userId,
        siteEngineerId: input.siteEngineerId || null,
        location: input.location,
        startDate: input.startDate ?? null,
        targetEndDate: input.targetEndDate ?? null,
        notes: input.notes,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await seedPhases(tx, ctx.orgId, project.id);
    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "project",
      subjectId: project.id,
      type: "created",
      actorId: ctx.userId,
      payload: { code: project.code },
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "project.create",
      resource: "project",
      resourceId: project.id,
      after: project,
    });
    return project;
  });
}

export async function updateProject(
  ctx: AuthContext,
  id: string,
  input: ProjectInput,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Project not found");
    const [after] = await tx
      .update(projects)
      .set({
        name: input.name,
        projectType: input.projectType,
        accountId: input.accountId ?? null,
        contractValue: toNum(input.contractValue),
        status: input.status,
        health: input.health,
        pmId: input.pmId || null,
        siteEngineerId: input.siteEngineerId || null,
        location: input.location,
        startDate: input.startDate ?? null,
        targetEndDate: input.targetEndDate ?? null,
        notes: input.notes,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "project.update",
      resource: "project",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

export async function savePhases(
  ctx: AuthContext,
  projectId: string,
  input: PhasesInput,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)))
      .limit(1);
    if (!project) throw new Error("Project not found");

    for (const p of input.phases) {
      const completed = p.status === "completed";
      const notStarted = p.status === "not_started";
      await tx
        .update(projectPhases)
        .set({
          status: p.status,
          progressPct: completed ? 100 : notStarted ? 0 : p.progressPct,
          startedAt: notStarted ? null : sql`coalesce(${projectPhases.startedAt}, now())`,
          completedAt: completed ? sql`coalesce(${projectPhases.completedAt}, now())` : null,
        })
        .where(
          and(
            eq(projectPhases.id, p.id),
            eq(projectPhases.projectId, projectId),
            eq(projectPhases.orgId, ctx.orgId),
          ),
        );
    }

    await tx.insert(activityEvents).values({
      orgId: ctx.orgId,
      subjectType: "project",
      subjectId: projectId,
      type: "phases_updated",
      actorId: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "project.phases",
      resource: "project",
      resourceId: projectId,
      after: { phases: input.phases },
    });
  });
}

export async function addMilestone(
  ctx: AuthContext,
  projectId: string,
  input: MilestoneInput,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    await assertProject(tx, ctx, projectId);
    await tx.insert(projectMilestones).values({
      orgId: ctx.orgId,
      projectId,
      title: input.title,
      dueDate: input.dueDate ?? null,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "milestone.create",
      resource: "project",
      resourceId: projectId,
      after: { title: input.title },
    });
  });
}

export async function toggleMilestone(
  ctx: AuthContext,
  milestoneId: string,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    const [m] = await tx
      .select()
      .from(projectMilestones)
      .where(
        and(
          eq(projectMilestones.id, milestoneId),
          eq(projectMilestones.orgId, ctx.orgId),
        ),
      )
      .limit(1);
    if (!m) throw new Error("Milestone not found");
    const done = m.status !== "done";
    await tx
      .update(projectMilestones)
      .set({
        status: done ? "done" : "pending",
        completedAt: done ? new Date() : null,
      })
      .where(eq(projectMilestones.id, milestoneId));
  });
}

export async function addSnag(
  ctx: AuthContext,
  projectId: string,
  input: SnagInput,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    await assertProject(tx, ctx, projectId);
    await tx.insert(snags).values({
      orgId: ctx.orgId,
      projectId,
      title: input.title,
      description: input.description,
      severity: input.severity,
      dueDate: input.dueDate ?? null,
      raisedBy: ctx.userId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "snag.create",
      resource: "project",
      resourceId: projectId,
      after: { title: input.title, severity: input.severity },
    });
  });
}

export async function updateSnagStatus(
  ctx: AuthContext,
  snagId: string,
  status: SnagStatusKey,
) {
  requirePermission(ctx, "project.update");
  return db.transaction(async (tx) => {
    const [s] = await tx
      .select()
      .from(snags)
      .where(and(eq(snags.id, snagId), eq(snags.orgId, ctx.orgId)))
      .limit(1);
    if (!s) throw new Error("Snag not found");
    const resolved = status === "resolved" || status === "closed";
    await tx
      .update(snags)
      .set({
        status,
        resolvedAt: resolved ? (s.resolvedAt ?? new Date()) : null,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(snags.id, snagId));
  });
}

export async function softDeleteProject(ctx: AuthContext, id: string) {
  requirePermission(ctx, "project.delete");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Project not found");
    await tx
      .update(projects)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(projects.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "project.delete",
      resource: "project",
      resourceId: id,
      before,
    });
  });
}

export async function projectActivity(ctx: AuthContext, id: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.orgId, ctx.orgId),
        eq(activityEvents.subjectType, "project"),
        eq(activityEvents.subjectId, id),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(25);
}

async function assertProject(
  tx: Transaction,
  ctx: AuthContext,
  projectId: string,
) {
  const [p] = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.orgId)))
    .limit(1);
  if (!p) throw new Error("Project not found");
}
