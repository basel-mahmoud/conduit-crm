import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PoForm } from "@/components/inventory/po-form";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New purchase order" };

export default async function NewPoPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "po.create")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
      </div>
    );
  }
  const accounts = await listAccountOptions(ctx);
  const suppliers = accounts.filter(
    (a) => a.type === "supplier" || a.type === "brand_partner",
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href="/inventory/po"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Purchase orders
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">
        New purchase order
      </h2>
      <div className="mt-6">
        <PoForm suppliers={suppliers} />
      </div>
    </div>
  );
}
