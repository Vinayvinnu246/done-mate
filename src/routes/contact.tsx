import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock } from "lucide-react";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact DoneMate — We're here to help" },
      { name: "description", content: "Get in touch with the DoneMate team. Email support@donemate.co.uk for help with your booking, account or provider application." },
      { property: "og:title", content: "Contact DoneMate" },
      { property: "og:description", content: "Reach the DoneMate support team by email." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalPage eyebrow="Contact" title="We're here to help." intro="Our support team typically replies within a few hours during UK business hours. For urgent booking issues, please include your job reference.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Mail className="h-5 w-5 text-primary" />
          <div className="mt-3 text-sm font-semibold">Email</div>
          <a href="mailto:support@donemate.co.uk" className="mt-1 block text-sm text-muted-foreground hover:text-foreground">support@donemate.co.uk</a>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Clock className="h-5 w-5 text-primary" />
          <div className="mt-3 text-sm font-semibold">Support hours</div>
          <div className="mt-1 text-sm text-muted-foreground">Mon–Sat, 8am–8pm</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <MapPin className="h-5 w-5 text-primary" />
          <div className="mt-3 text-sm font-semibold">Registered office</div>
          <div className="mt-1 text-sm text-muted-foreground">EAGLERA LTD, London, United Kingdom</div>
        </div>
      </div>
      <Section heading="Get in touch">
        <p>Whether you have a question about a quote, need help with a booking, or want to become a DoneMate pro, email us at <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a> and we'll get back to you as soon as we can.</p>
      </Section>
      <Section heading="Media & partnerships">
        <p>For press enquiries or partnership opportunities, please email <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a> with the subject line "Press" or "Partnership".</p>
      </Section>
    </LegalPage>
  );
}