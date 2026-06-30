import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AccountForm } from "@/components/accounts/account-form";
import { getAccount } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit account" };

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const account = await getAccount(ctx, id);
  if (!account) notFound();

  if (!can(ctx, "account.update")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to edit this account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href={`/accounts/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {account.name}
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">Edit account</h2>
      <div className="mt-6">
        <AccountForm account={account} />
      </div>
    </div>
  );
}
