import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY, LEGAL_REVIEW_NOTE } from "@/lib/company";

export const Route = createFileRoute("/provider-terms")({
  head: () => ({
    meta: [
      { title: "Provider Terms — DoneToday" },
      { name: "description", content: "The terms that govern service providers on DoneToday: eligibility, verification, quoting, payments, conduct and account suspension." },
      { property: "og:title", content: "DoneToday Provider Terms" },
      { property: "og:description", content: "Terms for professionals using DoneToday." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProviderTermsPage,
});

function ProviderTermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Provider Terms" intro={`These terms apply to service providers using DoneToday, operated by ${COMPANY.legalName}.`}>
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{LEGAL_REVIEW_NOTE}</p>
      <Section heading="1. Eligibility">
        <p>You must be at least 18 years old, legally entitled to work in the {COMPANY.jurisdiction}, and operating a legitimate trade or business.</p>
      </Section>
      <Section heading="2. Verification">
        <p>You agree to complete identity verification and, where relevant, DBS or right-to-work checks. False information is grounds for immediate removal.</p>
      </Section>
      <Section heading="3. Insurance">
        <p>You must hold appropriate public liability insurance and any specialist cover required for your trade. Proof must be kept current on your profile.</p>
      </Section>
      <Section heading="4. Qualifications">
        <p>Trades that require certification (e.g. Gas Safe, NICEIC) must upload valid, in-date credentials. Working outside your certified scope is prohibited.</p>
      </Section>
      <Section heading="5. Pricing and quotes">
        <p>Quotes must be honest, complete and reflect the full scope of work. Adding fees after acceptance without customer consent is not permitted.</p>
      </Section>
      <Section heading="6. Payments and commission">
        <p>Payments are processed through DoneToday. A 15% platform fee is deducted from completed bookings. Payouts are made to your registered bank account.</p>
      </Section>
      <Section heading="7. Conduct and communication">
        <p>Communicate professionally and only through the DoneToday platform until a booking is confirmed. Sharing personal contact details early is discouraged.</p>
      </Section>
      <Section heading="8. Prohibited behaviour">
        <ul className="list-disc space-y-1 pl-6">
          <li>Bypassing DoneToday payments.</li>
          <li>Fake reviews or manipulating reputation.</li>
          <li>Harassment, discrimination or unsafe practice.</li>
          <li>Sub-contracting work without disclosure.</li>
        </ul>
      </Section>
      <Section heading="9. Account suspension and fraud">
        <p>We may suspend or terminate accounts that breach these terms, fail verification checks, or show signs of fraud. Withheld funds may be used to settle refunds and chargebacks.</p>
      </Section>
      <Section heading="Contact">
        <p>Provider support: <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
      </Section>
    </LegalPage>
  );
}