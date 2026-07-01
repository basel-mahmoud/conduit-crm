import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/inventory/product-form";
import { getProductFull } from "@/modules/inventory/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const data = await getProductFull(ctx, id);
  if (!data) notFound();
  if (!can(ctx, "inventory.manage")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href={`/inventory/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {data.product.name}
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">Edit product</h2>
      <div className="mt-6">
        <ProductForm
          product={data.product}
          manufacturerName={data.product.manufacturerName}
        />
      </div>
    </div>
  );
}
