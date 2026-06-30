import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProjectForm } from "@/components/projects/project-form";
import { listAccountOptions } from "@/modules/accounts/service";
import { can } from "@/server/rbac/guard";
import { requireAuthContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const ctx = await requireAuthContext();
  if (!can(ctx, "project.create")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&rsquo;t have permission to create projects.
        </p>
      </div>
    );
  }
  const accounts = await listAccountOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Projects
      </Link>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">New project</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The five execution phases are created automatically.
      </p>
      <div className="mt-6">
        <ProjectForm accounts={accounts} />
      </div>
    </div>
  );
}
