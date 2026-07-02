import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-16">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Conduit
          </p>
          <h1 className="mt-2 text-lg font-semibold tracking-tight">
            Request access
          </h1>
        </div>
        <SignUp />
        <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
          Demonstration environment with fictional sample data. Do not enter real
          or confidential information. By continuing you accept the{" "}
          <a href="/legal" className="underline underline-offset-2 hover:text-foreground">
            disclaimer &amp; terms of use
          </a>
          .
        </p>
      </div>
    </main>
  );
}
