"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-danger">
        Error
      </div>
      <h2 className="mt-2 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error occurred. You can retry, or head back to the
        dashboard.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-4 font-mono text-[10px] text-muted-foreground">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
