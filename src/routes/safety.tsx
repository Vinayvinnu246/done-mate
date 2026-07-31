import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MessageSquare, CreditCard, UserCheck, HardHat } from "lucide-react";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety Centre — DoneMate" },
      { name: "description", content: "Safety advice for customers and providers using DoneMate: meeting safely, verifying identity, secure payments and emergency guidance." },
      { property: "og:title", content: "DoneMate Safety Centre" },
      { property: "og:description", content: "Guidance to keep customers and providers safe." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Safety"
      title="Safety Centre"
      intro="Practical guidance for customers and providers so every job goes smoothly and safely."
    >
      <Section heading="For customers">
        <Grid
          items={[
            { icon: UserCheck, t: "Verify the provider", d: "Check the verification badges and reviews on their profile before booking." },
            { icon: MessageSquare, t: "Keep chat in-app", d: "Use DoneMate messaging so we can help if anything goes wrong." },
            { icon: CreditCard, t: "Pay only through DoneMate", d: "Never send money outside the platform. Escrow protects both sides." },
            { icon: ShieldCheck, t: "Meet safely", d: "For home visits, ask for photo ID on arrival and let a friend know." },
          ]}
        />
      </Section>
      <Section heading="For providers">
        <Grid
          items={[
            { icon: HardHat, t: "Work safely", d: "Use appropriate PPE and follow trade regulations for every job." },
            { icon: UserCheck, t: "Confirm the customer", d: "Verify the address and contact before you set off." },
            { icon: MessageSquare, t: "Professional conduct", d: "Keep communication polite, clear and in-app." },
            { icon: ShieldCheck, t: "Insurance in force", d: "Keep your public liability and trade certifications current." },
          ]}
        />
      </Section>
      <Section heading="Emergencies">
        <p>
          If you or someone else is in immediate danger, call the emergency services on <strong>999</strong> straight away.
          Then let us know at <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a> so we can support you.
        </p>
        <p>
          To report misconduct or a safety concern about a specific user, use the{" "}
          <Link to="/report-problem" className="text-primary underline">Report a problem</Link> form.
        </p>
      </Section>
    </LegalPage>
  );
}

function Grid({ items }: { items: { icon: React.ComponentType<{ className?: string }>; t: string; d: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.t} className="rounded-2xl border border-border bg-card p-5">
          <i.icon className="h-5 w-5 text-primary" />
          <div className="mt-3 text-sm font-semibold text-foreground">{i.t}</div>
          <div className="mt-1 text-sm text-muted-foreground">{i.d}</div>
        </div>
      ))}
    </div>
  );
}