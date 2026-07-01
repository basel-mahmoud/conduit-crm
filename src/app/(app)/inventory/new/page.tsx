import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/inventory/product-form";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const ctx = await requireAuthContext();
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
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Inventory
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">New product</h2>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
