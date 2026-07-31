import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account — DoneMate" },
      { name: "description", content: "How to delete your DoneMate account, what data we keep for legal reasons, and how long deletion takes." },
      { property: "og:title", content: "Delete your DoneMate account" },
      { property: "og:description", content: "Account deletion, data retention and process." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Account"
      title="Delete your account"
      intro="You have the right to close your DoneMate account at any time. Here's how it works."
    >
      <Section heading="Before you delete">
        <ul className="list-disc space-y-1 pl-6">
          <li>Complete or cancel any open bookings.</li>
          <li>Withdraw any wallet balance (providers).</li>
          <li>Download any receipts or invoices you may need later.</li>
        </ul>
      </Section>
      <Section heading="How to delete">
        <ol className="list-decimal space-y-1 pl-6">
          <li>Sign in and open <Link to="/settings" className="text-primary underline">Settings</Link>.</li>
          <li>Scroll to "Danger zone" and choose "Delete account".</li>
          <li>Confirm your password and the deletion prompt.</li>
        </ol>
        <p>Prefer email? Send a deletion request from your registered address to <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
      </Section>
      <Section heading="What we keep">
        <p>We may retain limited information — such as transaction records, tax documents and dispute history — for as long as required by law (typically up to 7 years).</p>
      </Section>
      <Section heading="How long deletion takes">
        <p>Your profile is removed within 30 days. Backups are purged in the normal course of our retention cycle.</p>
      </Section>
      <Section heading="Changed your mind?">
        <p>Deletion requests can be cancelled within 14 days by contacting <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
      </Section>
    </LegalPage>
  );
}