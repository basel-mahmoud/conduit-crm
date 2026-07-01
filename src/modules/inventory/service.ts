import {
  and,
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
  manufacturers,
  products,
  purchaseOrderLines,
  purchaseOrders,
  stockMovements,
} from "@/db/schema";
import { writeAudit } from "@/server/audit/audit";
import { allocateNumber } from "@/server/sequences/allocate";
import { requirePermission, type AuthContext } from "@/server/rbac/guard";
import type {
  AdjustStockInput,
  PoInput,
  PoLineInput,
  ProductInput,
} from "./schema";
import type { ProductCategoryKey } from "./labels";

const money = (v: number | undefined) => (v == null ? null : v.toFixed(2));

async function upsertManufacturer(
  tx: Transaction,
  orgId: string,
  name: string | undefined,
): Promise<string | null> {
  if (!name) return null;
  await tx
    .insert(manufacturers)
    .values({ orgId, name })
    .onConflictDoNothing({ target: [manufacturers.orgId, manufacturers.name] });
  const [m] = await tx
    .select({ id: manufacturers.id })
    .from(manufacturers)
    .where(and(eq(manufacturers.orgId, orgId), eq(manufacturers.name, name)))
    .limit(1);
  return m?.id ?? null;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  lowStock?: boolean;
  equipmentOnly?: boolean;
}

export async function listProducts(
  ctx: AuthContext,
  filters: ProductFilters = {},
) {
  requirePermission(ctx, "inventory.read");
  const conds: SQL[] = [
    eq(products.orgId, ctx.orgId),
    isNull(products.deletedAt),
  ];
  if (filters.category)
    conds.push(eq(products.category, filters.category as ProductCategoryKey));
  if (filters.equipmentOnly) {
    conds.push(
      inArray(products.category, [
        "controller",
        "ddc",
        "sensor",
        "actuator",
        "valve",
        "thermostat",
        "vfd",
        "btu_meter",
        "lighting_ctrl",
        "home_auto",
      ]),
    );
  }
  if (filters.lowStock)
    conds.push(
      sql`${products.stockQty} <= ${products.reorderLevel} and ${products.reorderLevel} > 0`,
    );
  if (filters.q) {
    const term = `%${filters.q}%`;
    conds.push(
      or(
        ilike(products.name, term),
        ilike(products.sku, term),
        ilike(products.modelNo, term),
      ) as SQL,
    );
  }
  return db
    .select({
      ...getTableColumns(products),
      manufacturerName: manufacturers.name,
    })
    .from(products)
    .leftJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(and(...conds))
    .orderBy(products.name)
    .limit(300);
}

export async function lowStockCount(ctx: AuthContext) {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(products)
    .where(
      and(
        eq(products.orgId, ctx.orgId),
        isNull(products.deletedAt),
        sql`${products.stockQty} <= ${products.reorderLevel} and ${products.reorderLevel} > 0`,
      ),
    );
  return Number(row?.c ?? 0);
}

export async function getProductFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "inventory.read");
  const [product] = await db
    .select({
      ...getTableColumns(products),
      manufacturerName: manufacturers.name,
    })
    .from(products)
    .leftJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(
      and(
        eq(products.id, id),
        eq(products.orgId, ctx.orgId),
        isNull(products.deletedAt),
      ),
    )
    .limit(1);
  if (!product) return null;
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(30);
  return { product, movements };
}

export async function listProductOptions(ctx: AuthContext) {
  requirePermission(ctx, "inventory.read");
  return db
    .select({ id: products.id, sku: products.sku, name: products.name })
    .from(products)
    .where(and(eq(products.orgId, ctx.orgId), isNull(products.deletedAt)))
    .orderBy(products.name)
    .limit(500);
}

export async function createProduct(ctx: AuthContext, input: ProductInput) {
  requirePermission(ctx, "inventory.manage");
  return db.transaction(async (tx) => {
    const manufacturerId = await upsertManufacturer(
      tx,
      ctx.orgId,
      input.manufacturerName,
    );
    const [product] = await tx
      .insert(products)
      .values({
        orgId: ctx.orgId,
        sku: input.sku,
        name: input.name,
        category: input.category,
        manufacturerId,
        modelNo: input.modelNo,
        unit: input.unit,
        cost: money(input.cost),
        sellPrice: money(input.sellPrice),
        leadTimeDays: input.leadTimeDays ?? null,
        reorderLevel: input.reorderLevel,
        datasheetUrl: input.datasheetUrl,
        status: input.status,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "product.create",
      resource: "product",
      resourceId: product.id,
      after: product,
    });
    return product;
  });
}

export async function updateProduct(
  ctx: AuthContext,
  id: string,
  input: ProductInput,
) {
  requirePermission(ctx, "inventory.manage");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Product not found");
    const manufacturerId = await upsertManufacturer(
      tx,
      ctx.orgId,
      input.manufacturerName,
    );
    const [after] = await tx
      .update(products)
      .set({
        sku: input.sku,
        name: input.name,
        category: input.category,
        manufacturerId,
        modelNo: input.modelNo,
        unit: input.unit,
        cost: money(input.cost),
        sellPrice: money(input.sellPrice),
        leadTimeDays: input.leadTimeDays ?? null,
        reorderLevel: input.reorderLevel,
        datasheetUrl: input.datasheetUrl,
        status: input.status,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "product.update",
      resource: "product",
      resourceId: id,
      before,
      after,
    });
    return after;
  });
}

export async function softDeleteProduct(ctx: AuthContext, id: string) {
  requirePermission(ctx, "inventory.manage");
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.orgId, ctx.orgId)))
      .limit(1);
    if (!before) throw new Error("Product not found");
    await tx
      .update(products)
      .set({ deletedAt: new Date(), updatedBy: ctx.userId })
      .where(eq(products.id, id));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "product.delete",
      resource: "product",
      resourceId: id,
      before,
    });
  });
}

export async function adjustStock(
  ctx: AuthContext,
  productId: string,
  input: AdjustStockInput,
) {
  requirePermission(ctx, "inventory.manage");
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select({ stockQty: products.stockQty })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.orgId, ctx.orgId)))
      .limit(1);
    if (!p) throw new Error("Product not found");
    await tx.insert(stockMovements).values({
      orgId: ctx.orgId,
      productId,
      qtyDelta: input.qtyDelta,
      reason: input.reason,
      note: input.note,
      createdBy: ctx.userId,
    });
    await tx
      .update(products)
      .set({
        stockQty: p.stockQty + input.qtyDelta,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "inventory.adjust",
      resource: "product",
      resourceId: productId,
      after: { qtyDelta: input.qtyDelta, reason: input.reason },
    });
  });
}

/* -------------------------------- Purchase orders -------------------------- */

export interface PoFilters {
  status?: string;
}

export async function listPurchaseOrders(
  ctx: AuthContext,
  filters: PoFilters = {},
) {
  requirePermission(ctx, "inventory.read");
  const conds: SQL[] = [
    eq(purchaseOrders.orgId, ctx.orgId),
    isNull(purchaseOrders.deletedAt),
  ];
  if (filters.status)
    conds.push(eq(purchaseOrders.status, filters.status as PoStatus));
  return db
    .select({
      ...getTableColumns(purchaseOrders),
      supplierName: accounts.name,
    })
    .from(purchaseOrders)
    .leftJoin(accounts, eq(accounts.id, purchaseOrders.supplierId))
    .where(and(...conds))
    .orderBy(desc(purchaseOrders.createdAt))
    .limit(200);
}

export async function getPurchaseOrderFull(ctx: AuthContext, id: string) {
  requirePermission(ctx, "inventory.read");
  const [po] = await db
    .select({ ...getTableColumns(purchaseOrders), supplierName: accounts.name })
    .from(purchaseOrders)
    .leftJoin(accounts, eq(accounts.id, purchaseOrders.supplierId))
    .where(
      and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.orgId, ctx.orgId),
        isNull(purchaseOrders.deletedAt),
      ),
    )
    .limit(1);
  if (!po) return null;
  const lines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.poId, id));
  return { po, lines };
}

export async function createPurchaseOrder(ctx: AuthContext, input: PoInput) {
  requirePermission(ctx, "po.create");
  return db.transaction(async (tx) => {
    const { formatted } = await allocateNumber(tx, ctx.orgId, "po");
    const [po] = await tx
      .insert(purchaseOrders)
      .values({
        orgId: ctx.orgId,
        number: formatted,
        supplierId: input.supplierId ?? null,
        status: "draft",
        orderDate: input.orderDate ?? null,
        expectedDate: input.expectedDate ?? null,
        notes: input.notes,
        ownerId: ctx.userId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "po.create",
      resource: "po",
      resourceId: po.id,
      after: po,
    });
    return po;
  });
}

export async function addPoLine(
  ctx: AuthContext,
  poId: string,
  input: PoLineInput,
) {
  requirePermission(ctx, "po.create");
  return db.transaction(async (tx) => {
    const [po] = await tx
      .select({ id: purchaseOrders.id })
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.orgId, ctx.orgId)))
      .limit(1);
    if (!po) throw new Error("PO not found");
    const lineTotal = (input.qty * input.unitCost).toFixed(2);
    await tx.insert(purchaseOrderLines).values({
      orgId: ctx.orgId,
      poId,
      productId: input.productId ?? null,
      description: input.description,
      qty: input.qty,
      unitCost: input.unitCost.toFixed(2),
      lineTotal,
    });
    const lines = await tx
      .select({ lt: purchaseOrderLines.lineTotal })
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.poId, poId));
    const total = lines.reduce((a, l) => a + Number(l.lt), 0).toFixed(2);
    await tx
      .update(purchaseOrders)
      .set({ total, updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, poId));
  });
}

export async function setPoStatus(
  ctx: AuthContext,
  id: string,
  status: PoStatus,
) {
  requirePermission(ctx, "po.create");
  await db
    .update(purchaseOrders)
    .set({ status, updatedBy: ctx.userId, updatedAt: new Date() })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.orgId, ctx.orgId)));
}

/** Receive a PO: increment stock for each un-received line, mark received. */
export async function receivePurchaseOrder(ctx: AuthContext, poId: string) {
  requirePermission(ctx, "po.approve");
  return db.transaction(async (tx) => {
    const [po] = await tx
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.orgId, ctx.orgId)))
      .limit(1);
    if (!po) throw new Error("PO not found");
    const lines = await tx
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.poId, poId));

    for (const l of lines) {
      if (l.received) continue;
      if (l.productId) {
        const [p] = await tx
          .select({ stockQty: products.stockQty })
          .from(products)
          .where(eq(products.id, l.productId))
          .limit(1);
        if (p) {
          await tx
            .update(products)
            .set({ stockQty: p.stockQty + l.qty, updatedBy: ctx.userId })
            .where(eq(products.id, l.productId));
          await tx.insert(stockMovements).values({
            orgId: ctx.orgId,
            productId: l.productId,
            qtyDelta: l.qty,
            reason: "purchase",
            refType: "po",
            refId: poId,
            note: po.number,
            createdBy: ctx.userId,
          });
        }
      }
      await tx
        .update(purchaseOrderLines)
        .set({ received: true })
        .where(eq(purchaseOrderLines.id, l.id));
    }

    await tx
      .update(purchaseOrders)
      .set({ status: "received", updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, poId));
    await writeAudit(tx, {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: "po.receive",
      resource: "po",
      resourceId: poId,
      after: { status: "received", lines: lines.length },
    });
  });
}

export async function softDeletePurchaseOrder(ctx: AuthContext, id: string) {
  requirePermission(ctx, "po.create");
  await db
    .update(purchaseOrders)
    .set({ deletedAt: new Date(), updatedBy: ctx.userId })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.orgId, ctx.orgId)));
}

type PoStatus = "draft" | "ordered" | "received" | "cancelled";
