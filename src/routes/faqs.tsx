import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — DoneMate" },
      { name: "description", content: "Answers to common questions about DoneMate: quotes, payments, providers, refunds and support." },
      { property: "og:title", content: "DoneMate FAQs" },
      { property: "og:description", content: "Common questions answered." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FaqsPage,
});

const faqs = [
  { q: "How do I post a job?", a: "Tap 'Get a quote', describe what you need, add a few photos and your postcode. It takes about 60 seconds." },
  { q: "How do I receive quotes?", a: "Verified providers matching your service and area send quotes directly in-app. You'll be notified of each new quote." },
  { q: "How do providers get paid?", a: "Once you confirm the job is complete, funds are released from escrow to the provider's bank account within a couple of working days." },
  { q: "How does DoneMate make money?", a: "DoneMate charges providers a 15% platform fee on completed bookings. Posting a job and receiving quotes is free for customers." },
  { q: "How do refunds work?", a: "If a job isn't completed or falls short of what was agreed, you can open a dispute. See our Refund Policy for full details." },
  { q: "How do I contact support?", a: "Email support@donemate.co.uk or use the Report a Problem form. We aim to respond within one working day." },
  { q: "How do I become a provider?", a: "Sign up as a pro, complete the onboarding wizard, upload your ID and insurance, and add the services you offer." },
  { q: "What documents are required?", a: "Government ID, proof of address, public liability insurance, and any qualifications relevant to your trade (e.g. Gas Safe, NICEIC)." },
];

function FaqsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);
  return (
    <LegalPage eyebrow="Support" title="Frequently asked questions" intro="Quick answers to the questions we hear most.">
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          aria-label="Search FAQs"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
      </div>
      <Section heading={`${filtered.length} question${filtered.length === 1 ? "" : "s"}`}>
        <div className="space-y-3">
          {filtered.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">{f.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No results. Try a different search or email support@donemate.co.uk.</p>
          )}
        </div>
      </Section>
    </LegalPage>
  );
}