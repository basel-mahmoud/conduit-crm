import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer & Terms of Use",
  description:
    "Conduit is a demonstration build. All data shown is fictional sample data for evaluation only.",
};

const UPDATED = "2 July 2026";

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-6">
      <h2 className="text-sm font-semibold tracking-tight">
        <span className="mr-2 font-mono text-[11px] text-muted-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <div className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Conduit
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Disclaimer &amp; Terms of Use
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Last updated {UPDATED}. Please read this notice before using or viewing
          this application.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-[13px] leading-relaxed text-warning">
        This is a private <strong>demonstration and evaluation build</strong>. It
        is not a live product, is not connected to any real business operations,
        and must not be used to make real commercial, financial, or engineering
        decisions.
      </div>

      <Section n="1." title="Demonstration software">
        <p>
          Conduit is provided solely for demonstration, evaluation, and preview
          purposes. Features, data, calculations, and availability may change,
          break, or be removed at any time without notice. Nothing here
          constitutes a commercial offer, contract, or commitment of any kind.
        </p>
      </Section>

      <Section n="2." title="Fictional sample data">
        <p>
          All organizations, contacts, projects, quotations, prices, margins,
          contracts, tickets, inventory, and any other records shown are{" "}
          <strong className="text-foreground">
            fictional sample data generated for demonstration
          </strong>
          . Any resemblance to real companies, persons, projects, or commercial
          terms is entirely coincidental. Figures shown (including costs, margins,
          values, and AI-generated suggestions) are illustrative only and must not
          be relied upon.
        </p>
      </Section>

      <Section n="3." title="No professional advice">
        <p>
          Content produced by this application — including AI-generated scores,
          assessments, recommendations, and drafts — is automated, may be
          inaccurate, and does not constitute financial, legal, engineering,
          procurement, or other professional advice. Always obtain qualified
          professional review before acting on anything shown here.
        </p>
      </Section>

      <Section n="4." title="Do not enter real or confidential data">
        <p>
          Do not enter real personal data, customer information, payment or bank
          details, passwords, or confidential business information into this
          demonstration. Any data entered may be visible to other demo viewers,
          is not covered by any data-processing agreement, and may be deleted at
          any time.
        </p>
      </Section>

      <Section n="5." title='Provided "as is" — no warranty'>
        <p>
          This application is provided{" "}
          <strong className="text-foreground">&ldquo;as is&rdquo;</strong> and{" "}
          <strong className="text-foreground">&ldquo;as available&rdquo;</strong>,
          without warranties of any kind, whether express or implied, including
          but not limited to merchantability, fitness for a particular purpose,
          accuracy, or non-infringement. Use is entirely at your own risk.
        </p>
      </Section>

      <Section n="6." title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, the owner and operator of this
          demonstration shall not be liable for any direct, indirect, incidental,
          consequential, or other damages arising from access to, use of, or
          reliance on this application or any content or data within it.
        </p>
      </Section>

      <Section n="7." title="Third-party services">
        <p>
          This demonstration is built on third-party platforms — including
          authentication, database, hosting, and AI providers — each governed by
          its own terms and privacy policies. Their inclusion does not imply any
          endorsement, partnership, or transfer of liability.
        </p>
      </Section>

      <Section n="8." title="Confidentiality">
        <p>
          This build may be shared for private evaluation. If it was shared with
          you under a confidentiality or non-disclosure arrangement, please treat
          its contents accordingly and do not redistribute access.
        </p>
      </Section>

      <p className="mt-8 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
        By continuing to use or view this application you acknowledge that you
        have read and understood this notice.
      </p>
    </main>
  );
}
