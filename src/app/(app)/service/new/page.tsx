import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TicketForm } from "@/components/service/ticket-form";
import { listAccountOptions } from "@/modules/accounts/service";
import { listContractOptions } from "@/modules/contracts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New ticket" };

export default async function NewTicketPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "ticket.create")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
      </div>
    );
  }
  const [accounts, contracts] = await Promise.all([
    listAccountOptions(ctx),
    listContractOptions(ctx),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href="/service"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Service
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">New ticket</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Priority sets the SLA response and resolution targets automatically.
      </p>
      <div className="mt-6">
        <TicketForm accounts={accounts} contracts={contracts} />
      </div>
    </div>
  );
}
