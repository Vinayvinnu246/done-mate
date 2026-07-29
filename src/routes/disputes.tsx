import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title: "Disputes — DoneToday" },
      { name: "description", content: "How to open a dispute on DoneToday, what evidence to include and how our team resolves issues fairly." },
      { property: "og:title", content: "DoneToday Disputes" },
      { property: "og:description", content: "Fair dispute resolution for customers and providers." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DisputesPage,
});

function DisputesPage() {
  return (
    <LegalPage
      eyebrow="Disputes"
      title="Fair outcomes, every time."
      intro="If something goes wrong with a job, don't worry. Our disputes team is here to mediate between customers and providers and make things right."
    >
      <Section heading="When to open a dispute">
        <p>You can open a dispute if:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>The work was not completed to the agreed standard.</li>
          <li>The provider did not turn up or abandoned the job.</li>
          <li>You were charged for work that was misrepresented.</li>
          <li>Property was damaged during the job.</li>
        </ul>
      </Section>
      <Section heading="How to open a dispute">
        <ol className="list-decimal space-y-1 pl-6">
          <li>Open the job page from your dashboard.</li>
          <li>Tap "Report a problem" and describe what went wrong.</li>
          <li>Upload photos, videos or documents as evidence.</li>
          <li>Our team will review and respond within 48 hours.</li>
        </ol>
      </Section>
      <Section heading="How disputes are resolved">
        <p>A DoneToday case handler reviews the evidence from both sides, the message history and any agreed scope of work. Outcomes may include full or partial refund, rework at no extra cost, or release of payment to the provider.</p>
        <p>While a dispute is open, funds held in escrow are frozen and will not be released until the case is closed.</p>
      </Section>
      <Section heading="Need help now?">
        <p>Email <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a> with your job reference and a short summary. We'll take it from there.</p>
      </Section>
    </LegalPage>
  );
}