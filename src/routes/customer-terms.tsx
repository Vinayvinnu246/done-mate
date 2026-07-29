import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY, LEGAL_REVIEW_NOTE } from "@/lib/company";

export const Route = createFileRoute("/customer-terms")({
  head: () => ({
    meta: [
      { title: "Customer Terms — DoneToday" },
      { name: "description", content: "The terms that apply to customers on DoneToday: posting jobs, quotes, payments, refunds, reviews and disputes." },
      { property: "og:title", content: "DoneToday Customer Terms" },
      { property: "og:description", content: "Terms for customers using DoneToday." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CustomerTermsPage,
});

function CustomerTermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Customer Terms" intro={`These terms apply to customers using DoneToday, operated by ${COMPANY.legalName}.`}>
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{LEGAL_REVIEW_NOTE}</p>
      <Section heading="1. Posting jobs">
        <p>Provide accurate details, photos and locations. Misleading listings may be removed.</p>
      </Section>
      <Section heading="2. Receiving quotes">
        <p>Verified providers may send quotes. You are under no obligation to accept any quote.</p>
      </Section>
      <Section heading="3. Choosing providers">
        <p>You are responsible for reviewing provider profiles, reviews and verification badges before accepting a quote.</p>
      </Section>
      <Section heading="4. Payments">
        <p>Payments are made through DoneToday and held in escrow until the job is complete. Paying providers outside the platform is not permitted and voids protection.</p>
      </Section>
      <Section heading="5. Refunds">
        <p>See our <a href="/refund-policy" className="text-primary underline">Refund Policy</a> for cancellations and dispute-based refunds.</p>
      </Section>
      <Section heading="6. Reviews">
        <p>Only customers with a completed booking may leave a review. Reviews must be honest, respectful and based on the work performed.</p>
      </Section>
      <Section heading="7. Communication">
        <p>Keep messages in-app until a booking is confirmed. This helps us support you if anything goes wrong.</p>
      </Section>
      <Section heading="8. Cancellations">
        <p>Cancellation terms are set out in our Refund Policy. Repeated late cancellations may result in account restrictions.</p>
      </Section>
      <Section heading="9. Disputes">
        <p>Use the <a href="/dispute-resolution" className="text-primary underline">Dispute Resolution</a> process to raise issues about a job.</p>
      </Section>
      <Section heading="10. Your responsibilities">
        <p>Provide safe site access, accurate scope of work, and prompt responses so providers can do a good job.</p>
      </Section>
      <Section heading="Contact">
        <p>Customer support: <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
      </Section>
    </LegalPage>
  );
}