import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/provider-agreement")({
  head: () => ({
    meta: [
      { title: "Provider Agreement — DoneToday" },
      { name: "description", content: "The terms that apply to service providers offering work through DoneToday, operated by EAGLERA LTD." },
      { property: "og:title", content: "DoneToday Provider Agreement" },
      { property: "og:description", content: "Terms for pros on DoneToday." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProviderAgreementPage,
});

function ProviderAgreementPage() {
  return (
    <LegalPage eyebrow="Legal" title="Provider Agreement" intro="This agreement applies to service providers offering work through DoneToday. It supplements our general Terms & Conditions.">
      <Section heading="1. Independent status">
        <p>You are an independent contractor and not an employee, worker or agent of EAGLERA LTD. You are responsible for your own taxes, tools, insurance and compliance with UK law.</p>
      </Section>
      <Section heading="2. Verification">
        <p>You agree to complete identity verification and, where relevant, provide proof of insurance, trade certification and DBS checks. We may suspend your account if verification lapses.</p>
      </Section>
      <Section heading="3. Quoting and bookings">
        <p>You set your own prices when quoting. Once a customer books, you commit to delivering the work at the agreed price, date and scope. Any changes must be agreed in-app via a formal additional-work request.</p>
      </Section>
      <Section heading="4. Platform fee and payouts">
        <p>DoneToday charges a platform fee of 10% on the value of each completed booking. Funds are held in escrow and paid to your nominated bank account within 2 working days of the customer marking the job complete.</p>
      </Section>
      <Section heading="5. Standards of conduct">
        <ul className="list-disc space-y-1 pl-6">
          <li>Communicate only through DoneToday until a booking is confirmed.</li>
          <li>Never request or accept payment off-platform.</li>
          <li>Turn up on time and deliver work to a professional standard.</li>
          <li>Treat customers and property with respect.</li>
        </ul>
      </Section>
      <Section heading="6. Suspension and termination">
        <p>We may suspend or terminate your account for breach of this agreement, poor performance, safety concerns or fraudulent activity. You may close your account at any time by emailing <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>.</p>
      </Section>
      <Section heading="7. Governing law">
        <p>This agreement is governed by the laws of England &amp; Wales.</p>
      </Section>
    </LegalPage>
  );
}