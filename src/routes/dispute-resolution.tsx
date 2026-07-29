import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY, LEGAL_REVIEW_NOTE } from "@/lib/company";

export const Route = createFileRoute("/dispute-resolution")({
  head: () => ({
    meta: [
      { title: "Dispute Resolution — DoneToday" },
      { name: "description", content: "How DoneToday investigates disputes between customers and providers, what evidence to submit and the possible outcomes." },
      { property: "og:title", content: "DoneToday Dispute Resolution" },
      { property: "og:description", content: "Reporting, investigation, outcomes and appeals." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DisputeResolutionPage,
});

function DisputeResolutionPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Dispute Resolution"
      intro="A fair, transparent process for resolving issues between customers and providers."
    >
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{LEGAL_REVIEW_NOTE}</p>
      <Section heading="1. Reporting a dispute">
        <p>Open a dispute from the job page within 7 days of the scheduled completion. Choose the reason and describe what went wrong.</p>
      </Section>
      <Section heading="2. Evidence submission">
        <p>Both parties can upload photos, videos, invoices, quotes and message history. Clear, timestamped evidence leads to faster outcomes.</p>
      </Section>
      <Section heading="3. Platform investigation">
        <p>A DoneToday case handler reviews all evidence, the agreed scope of work and communication history. Funds in escrow are frozen while the case is open.</p>
      </Section>
      <Section heading="4. Possible outcomes">
        <ul className="list-disc space-y-1 pl-6">
          <li>Full or partial refund to the customer.</li>
          <li>Rework at no extra cost.</li>
          <li>Release of payment to the provider.</li>
          <li>Account restrictions where misconduct is found.</li>
        </ul>
      </Section>
      <Section heading="5. Appeal process">
        <p>Either party may appeal within 7 days by replying to the case decision with new evidence. Appeals are reviewed by a different case handler.</p>
      </Section>
      <Section heading="Need help?">
        <p>Email <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a> with your job reference.</p>
      </Section>
    </LegalPage>
  );
}