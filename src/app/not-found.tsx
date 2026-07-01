import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="font-mono text-4xl font-semibold tabular-nums">404</div>
      <p className="mt-2 text-sm text-muted-foreground">
        This page could not be found.
      </p>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
