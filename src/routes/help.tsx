import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre — DoneToday" },
      { name: "description", content: "Answers to common questions about booking pros, quotes, payments and account management on DoneToday." },
      { property: "og:title", content: "DoneToday Help Centre" },
      { property: "og:description", content: "FAQs and support articles for customers and providers." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  { q: "How do I post a job?", a: "Tap 'Get quotes' on the home page, describe the job, add a few photos and your postcode. Verified pros in your area will send you real quotes within minutes." },
  { q: "How much does DoneToday cost customers?", a: "Posting a job and comparing quotes is completely free. You only pay the price agreed with your chosen pro, and payment is held securely until the job is complete." },
  { q: "How are providers verified?", a: "Every pro passes ID verification, insurance checks and — where relevant — DBS and trade certification checks before they can quote for work." },
  { q: "What if I'm not happy with the work?", a: "Don't release payment. Open a dispute from your job page and our team will step in to review the evidence and mediate a fair outcome." },
  { q: "How do providers get paid?", a: "Once you mark a job complete, funds are released from escrow and paid to the pro's bank account within 2 working days." },
  { q: "How do I contact support?", a: "Email us any time at support@donetoday.co.uk and include your job reference if you have one." },
];

function HelpPage() {
  return (
    <LegalPage
      eyebrow="Help Centre"
      title="How can we help?"
      intro="Quick answers to the questions we hear most. Can't find what you need? Email support@donetoday.co.uk."
    >
      <Section heading="Frequently asked questions">
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">{f.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <Section heading="Still need help?">
        <p>
          Our team is available Monday to Saturday, 8am–8pm. Email
          {" "}
          <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>{" "}
          and we'll get back to you quickly.
        </p>
      </Section>
    </LegalPage>
  );
}