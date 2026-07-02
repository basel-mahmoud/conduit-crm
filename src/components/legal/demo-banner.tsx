import Link from "next/link";
import { TriangleAlert } from "lucide-react";

/**
 * Always-visible notice that this is a demonstration build with fictional data.
 * Intentionally not dismissible so the disclaimer is present on every screen
 * during a client demo.
 */
export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warning/25 bg-warning/10 px-4 py-1.5 text-center text-[11.5px] leading-tight text-warning">
      <TriangleAlert className="size-3.5 shrink-0" />
      <span>
        Demonstration environment — all companies, people, figures and documents
        shown are <strong className="font-semibold">fictional sample data</strong>{" "}
        for evaluation only.{" "}
        <Link href="/legal" className="underline underline-offset-2 hover:opacity-80">
          Disclaimer
        </Link>
      </span>
    </div>
  );
}
