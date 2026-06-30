import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddContactForm } from "@/components/accounts/add-contact-form";
import {
  AccountTypeBadge,
  RatingBadge,
  StatusDot,
} from "@/components/accounts/badges";
import { RATING_LABELS } from "@/modules/accounts/labels";
import { deleteAccountAction } from "@/modules/accounts/actions";
import {
  accountActivity,
  getAccount,
  listContacts,
} from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "Account created",
  updated: "Account updated",
  contact_added: "Contact added",
};

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthContext();
  const account = await getAccount(ctx, id);
  if (!account) notFound();

  const [contacts, activity] = await Promise.all([
    listContacts(ctx, id),
    accountActivity(ctx, id),
  ]);
  const canEdit = can(ctx, "account.update");
  const canDelete = can(ctx, "account.delete");
  const canManageContacts = can(ctx, "contact.manage");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Accounts
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {account.name}
            </h2>
            <AccountTypeBadge type={account.type} />
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
            <StatusDot status={account.status} />
            <span className="text-border">·</span>
            <span
              className="inline-flex items-center gap-1.5"
              title={RATING_LABELS[account.rating]}
            >
              Rating <RatingBadge rating={account.rating} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/accounts/${account.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <form action={deleteAccountAction}>
              <input type="hidden" name="id" value={account.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Company details</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail k="Email" v={account.email} mono />
              <Detail k="Phone" v={account.phone} mono />
              <Detail k="Website" v={account.website} mono />
              <Detail k="Industry" v={account.industry} />
              <Detail k="Trade licence" v={account.tradeLicense} mono />
              <Detail k="VAT no." v={account.vatNo} mono />
              <Detail
                k="Address"
                v={
                  [account.addressLine, account.city, account.country]
                    .filter(Boolean)
                    .join(", ") || null
                }
                className="col-span-2"
              />
            </dl>
            {account.notes && (
              <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
                {account.notes}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Contacts</h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                {contacts.length}
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {contacts.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No contacts yet.
                </p>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                        {c.isPrimary && (
                          <span className="rounded bg-brand-weak px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
                            primary
                          </span>
                        )}
                      </div>
                      {c.title && (
                        <div className="text-[12px] text-muted-foreground">
                          {c.title}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono text-[11px] text-muted-foreground">
                      {c.email && <div>{c.email}</div>}
                      {(c.mobile || c.phone) && <div>{c.mobile || c.phone}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
            {canManageContacts && (
              <div className="mt-4 border-t border-border pt-4">
                <AddContactForm accountId={account.id} />
              </div>
            )}
          </section>
        </div>

        <aside>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Activity</h3>
            <ol className="mt-3 space-y-3">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <div className="text-[13px]">
                        {ACTIVITY_LABELS[e.type] ?? e.type}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  k,
  v,
  mono,
  className,
}: {
  k: string;
  v?: string | null;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className={mono ? "mt-0.5 font-mono text-[12.5px]" : "mt-0.5 text-sm"}>
        {v || "—"}
      </dd>
    </div>
  );
}
