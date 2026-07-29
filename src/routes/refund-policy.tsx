import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY, LEGAL_REVIEW_NOTE } from "@/lib/company";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — DoneToday" },
      { name: "description", content: "How refunds work on DoneToday: escrow payments, cancellations by customers or providers, and the dispute process." },
      { property: "og:title", content: "DoneToday Refund Policy" },
      { property: "og:description", content: "Refunds, cancellations and escrow release rules." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalPage eyebrow="Legal" title="Refund Policy" intro="This policy explains how refunds and cancellations are handled on DoneToday.">
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{LEGAL_REVIEW_NOTE}</p>
      <Section heading="Platform fees">
        <p>DoneToday charges providers a 15% platform fee on completed bookings. Platform fees are non-refundable except where required by law or where a job is cancelled by DoneToday.</p>
      </Section>
      <Section heading="Payment release">
        <p>Customer payments are held in escrow until the job is marked complete. Funds are then released to the provider (net of fees) after a short hold period.</p>
      </Section>
      <Section heading="Provider cancellations">
        <p>If a provider cancels a confirmed booking, the customer is refunded in full. Repeat cancellations may result in the provider's account being suspended.</p>
      </Section>
      <Section heading="Customer cancellations">
        <ul className="list-disc space-y-1 pl-6">
          <li>Free cancellation before a provider is confirmed.</li>
          <li>Cancellations more than 24 hours before the scheduled start: full refund.</li>
          <li>Cancellations within 24 hours: a cancellation fee may apply to compensate the provider.</li>
        </ul>
      </Section>
      <Section heading="Refund process">
        <p>Approved refunds are returned to your original payment method within 5–10 working days, depending on your bank.</p>
      </Section>
      <Section heading="Disputes">
        <p>If the work is incomplete or falls short of what was agreed, do not release payment. Open a dispute from the job page and our team will mediate a fair outcome.</p>
      </Section>
      <Section heading="Contact">
        <p>Refund questions: <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
      </Section>
    </LegalPage>
  );
}