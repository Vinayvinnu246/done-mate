import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Star, CheckCircle2 } from "lucide-react";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/trust-safety")({
  head: () => ({
    meta: [
      { title: "Trust & Safety — DoneToday" },
      { name: "description", content: "How DoneToday keeps customers and providers safe: ID verification, insurance checks, escrow payments and real reviews." },
      { property: "og:title", content: "Trust & Safety at DoneToday" },
      { property: "og:description", content: "Verified pros, escrow payments and real reviews on every booking." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TrustPage,
});

const pillars = [
  { i: ShieldCheck, t: "ID verified", d: "Government ID and selfie checks on every provider before they can quote." },
  { i: Sparkles, t: "Insurance checked", d: "Public liability insurance is verified and kept on file where required." },
  { i: CheckCircle2, t: "Escrow payments", d: "Funds are held securely and only released when you're happy with the work." },
  { i: Star, t: "Real reviews", d: "Only customers with completed bookings can leave a review — no fakes." },
];

function TrustPage() {
  return (
    <LegalPage
      eyebrow="Trust & Safety"
      title="Built for peace of mind."
      intro="This page is maintained by EAGLERA LTD to answer common security and safety questions about DoneToday. It describes the app-visible controls we enable today — it is not an independent certification."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.t} className="rounded-2xl border border-border bg-card p-5">
            <p.i className="h-5 w-5 text-primary" />
            <div className="mt-3 text-sm font-semibold">{p.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{p.d}</div>
          </div>
        ))}
      </div>
      <Section heading="Verifying providers">
        <p>Every pro on DoneToday completes identity verification and, where the trade requires it, insurance and background checks. Verified pros display a badge on their profile so customers can book with confidence.</p>
      </Section>
      <Section heading="Secure payments">
        <p>Payments are processed by a PCI-DSS-compliant provider and held in escrow. Funds are only released to your pro once you mark the job as complete, giving both sides peace of mind.</p>
      </Section>
      <Section heading="On-platform communication">
        <p>Messaging happens inside DoneToday so we can help if anything goes wrong. Sharing contact details or moving payment off-platform is a breach of our terms and puts your protection at risk.</p>
      </Section>
      <Section heading="Report a safety concern">
        <p>If you feel unsafe or witness suspicious activity, please contact us immediately at <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>. In an emergency, always call the local emergency services first.</p>
      </Section>
    </LegalPage>
  );
}