import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — DoneMate" },
      { name: "description", content: "The terms of service that govern your use of the DoneMate platform, operated by EAGLERA LTD." },
      { property: "og:title", content: "DoneMate Terms & Conditions" },
      { property: "og:description", content: "The terms that govern use of DoneMate." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms & Conditions" intro="These terms govern your use of DoneMate, a platform operated by EAGLERA LTD. By using our services you agree to these terms.">
      <Section heading="1. About us">
        <p>DoneMate is a trading name of <strong>EAGLERA LTD</strong>, a company registered in England &amp; Wales. Contact: <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a>.</p>
      </Section>
      <Section heading="2. The platform">
        <p>DoneMate is a marketplace that connects customers with independent service providers. We are not the provider of the services listed on the platform and do not employ providers. Contracts for services are formed directly between customers and providers.</p>
      </Section>
      <Section heading="3. Accounts">
        <p>You must be at least 18 years old and provide accurate information to create an account. You are responsible for keeping your login details secure and for all activity under your account.</p>
      </Section>
      <Section heading="4. Bookings and payments">
        <p>Customers pay through DoneMate, and funds are held in escrow until the job is complete. DoneMate charges providers a platform fee of 10% on completed bookings. Cancellation fees may apply where a booking is cancelled within 24 hours of the scheduled start.</p>
      </Section>
      <Section heading="5. Acceptable use">
        <p>You agree not to misuse the platform, including bypassing our payments, harassing other users, posting false reviews or sharing contact details before a booking is confirmed.</p>
      </Section>
      <Section heading="6. Liability">
        <p>DoneMate is not liable for the quality of services delivered by providers. Our liability to you is limited to the amount you paid to us in respect of the relevant booking, to the maximum extent permitted by law.</p>
      </Section>
      <Section heading="7. Changes to these terms">
        <p>We may update these terms from time to time. Material changes will be notified via email or in-app. Continued use of DoneMate after an update means you accept the revised terms.</p>
      </Section>
      <Section heading="8. Governing law">
        <p>These terms are governed by the laws of England &amp; Wales. Disputes are subject to the exclusive jurisdiction of the courts of England &amp; Wales.</p>
      </Section>
    </LegalPage>
  );
}