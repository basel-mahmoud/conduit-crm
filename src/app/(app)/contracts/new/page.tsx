import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ContractForm } from "@/components/contracts/contract-form";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New contract" };

export default async function NewContractPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "contract.create")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
      </div>
    );
  }
  const accounts = await listAccountOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> AMC &amp; PPM
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">New contract</h2>
      <div className="mt-6">
        <ContractForm accounts={accounts} />
      </div>
    </div>
  );
}
