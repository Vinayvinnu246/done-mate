import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — DoneToday" },
      { name: "description", content: "How EAGLERA LTD collects, uses and protects your personal information when you use DoneToday." },
      { property: "og:title", content: "DoneToday Privacy Policy" },
      { property: "og:description", content: "Our approach to your personal data." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" intro="This policy explains what personal information EAGLERA LTD collects through DoneToday, how we use it and the rights you have over your data.">
      <Section heading="Who we are">
        <p>EAGLERA LTD (trading as DoneToday) is the data controller for the personal information described in this policy. You can reach us at <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>.</p>
      </Section>
      <Section heading="Information we collect">
        <ul className="list-disc space-y-1 pl-6">
          <li>Account details: name, email, phone, profile photo.</li>
          <li>Job information: descriptions, photos, addresses, messages.</li>
          <li>Verification data (providers): ID documents, insurance, DBS.</li>
          <li>Payment metadata processed by our payment partners.</li>
          <li>Usage and device data to secure and improve the platform.</li>
        </ul>
      </Section>
      <Section heading="How we use your information">
        <p>To operate the marketplace, verify identities, process payments, prevent fraud, provide support and comply with our legal obligations. We do not sell your personal information.</p>
      </Section>
      <Section heading="Sharing">
        <p>We share limited information with the customer or provider you are transacting with, and with trusted processors (hosting, payments, messaging, identity checks) under strict contracts.</p>
      </Section>
      <Section heading="Your rights">
        <p>You have rights to access, correct, delete and port your data, and to object to certain processing. To exercise your rights, email <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>.</p>
      </Section>
      <Section heading="Retention">
        <p>We keep personal information only as long as needed to provide the service, meet legal obligations and resolve disputes.</p>
      </Section>
      <Section heading="Contact">
        <p>Questions or complaints? Email <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>. You may also lodge a complaint with the UK Information Commissioner's Office (ICO).</p>
      </Section>
    </LegalPage>
  );
}