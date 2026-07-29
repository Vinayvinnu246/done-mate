import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY, LEGAL_REVIEW_NOTE } from "@/lib/company";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "UK GDPR Privacy Policy — DoneToday" },
      { name: "description", content: "How EAGLERA LTD (trading as DoneToday) collects, uses, shares and protects your personal data under the UK GDPR and Data Protection Act 2018." },
      { property: "og:title", content: "DoneToday UK GDPR Privacy Policy" },
      { property: "og:description", content: "Your data rights, our lawful bases, retention periods and how to contact us or the ICO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const lastUpdated = "29 July 2026";
  return (
    <LegalPage
      eyebrow="Legal"
      title="UK GDPR Privacy Policy"
      intro="This policy explains how EAGLERA LTD (trading as DoneToday) collects, uses, shares, retains and protects your personal data, and the rights you have under the UK GDPR and the Data Protection Act 2018."
    >
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Last updated: {lastUpdated}. {LEGAL_REVIEW_NOTE}
      </p>

      <Section heading="1. Who we are (Data Controller)">
        <p>
          <strong>{COMPANY.legalName}</strong>, trading as <strong>{COMPANY.tradingName}</strong>, is the "data controller" responsible for your personal data when you use our website, mobile experiences and services (together, the "Platform"). We are registered in {COMPANY.jurisdiction} (company number {COMPANY.registration}). Registered office: {COMPANY.address}.
        </p>
        <p>
          Privacy contact: <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary underline">{COMPANY.privacyEmail}</a> · General support: <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.
        </p>
      </Section>

      <Section heading="2. Scope of this policy">
        <p>
          This policy applies to customers, service providers ("Pros"), visitors and applicants who interact with the Platform. Where a Pro processes personal data received from a customer to deliver a booked job, the Pro acts as an independent controller for that use, and their own privacy notice applies.
        </p>
      </Section>

      <Section heading="3. Personal data we collect">
        <p><strong>You give us:</strong></p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Identity &amp; contact data — name, email, phone, profile photo, date of birth (Pros).</li>
          <li>Account credentials — hashed passwords, OAuth tokens (e.g. Google sign-in).</li>
          <li>Job data — descriptions, photos, addresses, postcodes, scheduling and messages.</li>
          <li>Pro verification data — government ID, proof of address, insurance certificates, trade qualifications (e.g. Gas Safe, NICEIC), DBS results, right-to-work evidence.</li>
          <li>Financial data — bank details for payouts, Stripe Connect account identifiers, invoices, VAT status.</li>
          <li>Support &amp; dispute content — tickets, evidence uploads, correspondence.</li>
        </ul>
        <p><strong>We collect automatically:</strong></p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Device &amp; usage data — IP address, browser, operating system, pages viewed, referring URLs, timestamps.</li>
          <li>Approximate location derived from IP or postcode (with consent, precise location for matching).</li>
          <li>Cookies and similar technologies — see our <a href="/cookies" className="text-primary underline">Cookie Policy</a>.</li>
        </ul>
        <p><strong>We receive from third parties:</strong> identity verification providers, background-check providers, payment providers (Stripe), fraud-prevention services, and social login providers.</p>
        <p>
          <strong>Special category data.</strong> We do not intentionally collect special category data. If a job description includes health or other sensitive information, please share only what is strictly necessary.
        </p>
      </Section>

      <Section heading="4. How and why we use your data (lawful bases)">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Contract (Art. 6(1)(b))</strong> — creating accounts, matching customers with Pros, processing bookings, payments and payouts, providing customer support.</li>
          <li><strong>Legal obligation (Art. 6(1)(c))</strong> — anti-money-laundering, tax and accounting records, responding to lawful requests.</li>
          <li><strong>Legitimate interests (Art. 6(1)(f))</strong> — securing the Platform, preventing fraud, verifying Pros, improving our services, direct marketing to existing customers, and defending legal claims. You can object at any time.</li>
          <li><strong>Consent (Art. 6(1)(a))</strong> — non-essential cookies, marketing emails to prospects, precise location, and any optional features. You may withdraw consent at any time.</li>
        </ul>
      </Section>

      <Section heading="5. Who we share your data with">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Other Platform users</strong> — customers and Pros see the information needed to quote, communicate and complete a job (e.g. name, job details, address once a booking is confirmed).</li>
          <li><strong>Processors acting on our instructions</strong> — cloud hosting and database (Supabase / AWS), email, SMS &amp; push notifications, analytics, error monitoring, and customer-support tooling.</li>
          <li><strong>Payments &amp; payouts</strong> — Stripe Payments UK, Ltd. and Stripe Connect for escrow, KYC and payouts.</li>
          <li><strong>Identity, DBS and insurance verification providers.</strong></li>
          <li><strong>Professional advisers</strong> — lawyers, accountants, auditors and insurers.</li>
          <li><strong>Authorities</strong> — where required by law, court order or to protect our rights and users.</li>
          <li><strong>Corporate transactions</strong> — a buyer, investor or successor in a merger, acquisition or reorganisation.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </Section>

      <Section heading="6. International transfers">
        <p>
          Our processors may store or access data outside the UK, including the EEA and the United States. Where this happens, we rely on the UK Adequacy Regulations, the UK International Data Transfer Agreement (IDTA), or the EU Standard Contractual Clauses with the UK Addendum, together with additional safeguards where required.
        </p>
      </Section>

      <Section heading="7. How long we keep your data">
        <ul className="list-disc space-y-1 pl-6">
          <li>Account records — for the life of your account and up to 6 years after closure (to meet UK tax and limitation-period requirements).</li>
          <li>Booking, payment and payout records — 6 years after the transaction.</li>
          <li>Pro verification documents — for the duration of the Pro relationship plus 2 years, or longer where required by law.</li>
          <li>Support tickets and dispute evidence — up to 3 years after resolution.</li>
          <li>Marketing preferences — until you unsubscribe, plus a suppression record.</li>
          <li>Server, security and audit logs — up to 24 months.</li>
        </ul>
      </Section>

      <Section heading="8. How we protect your data">
        <p>
          We use TLS in transit, encryption at rest, role-based access controls, database Row-Level Security, secret management, principle-of-least-privilege for staff, and regular security reviews. Payments and card data are handled directly by Stripe (PCI DSS Level 1) — we never store full card numbers.
        </p>
      </Section>

      <Section heading="9. Your rights under UK GDPR">
        <p>Subject to conditions and exemptions in law, you have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Be informed about our processing (this policy).</li>
          <li>Access a copy of your personal data.</li>
          <li>Rectify inaccurate or incomplete data.</li>
          <li>Erasure ("right to be forgotten").</li>
          <li>Restrict processing.</li>
          <li>Data portability for data you provided to us.</li>
          <li>Object to processing based on legitimate interests or direct marketing.</li>
          <li>Withdraw consent at any time (without affecting prior processing).</li>
          <li>Not be subject to solely automated decisions with legal or similarly significant effects.</li>
        </ul>
        <p>
          To exercise any right, email <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary underline">{COMPANY.privacyEmail}</a>. We respond within one month (extendable by two months for complex requests) and may need to verify your identity.
        </p>
      </Section>

      <Section heading="10. Automated decision-making">
        <p>
          We use automated systems to match jobs to Pros, detect fraud and rank search results. These do not produce legal or similarly significant effects on you and always allow human review. Pro verification decisions involve human review.
        </p>
      </Section>

      <Section heading="11. Marketing">
        <p>
          We may send you service updates about jobs, quotes, payments and account security — these are not marketing. Marketing emails are sent only with a lawful basis and you can opt out via the unsubscribe link or your account settings.
        </p>
      </Section>

      <Section heading="12. Cookies">
        <p>
          The Platform uses strictly necessary cookies and, with your consent, preferences, analytics and marketing cookies. Manage your choices from the cookie banner or by clearing your consent in your browser. See our <a href="/cookies" className="text-primary underline">Cookie Policy</a>.
        </p>
      </Section>

      <Section heading="13. Children">
        <p>DoneToday is not directed at children under 18. We do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us to have it removed.</p>
      </Section>

      <Section heading="14. Changes to this policy">
        <p>We may update this policy from time to time. Material changes will be notified in-app or by email. The "Last updated" date at the top always shows the current version.</p>
      </Section>

      <Section heading="15. Contact us and complaints">
        <p>
          Data protection queries: <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary underline">{COMPANY.privacyEmail}</a>. Post: {COMPANY.legalName}, {COMPANY.address}.
        </p>
        <p>
          If you're unhappy with our response you have the right to complain to the UK Information Commissioner's Office (ICO): <a href="https://ico.org.uk/make-a-complaint/" className="text-primary underline" target="_blank" rel="noopener noreferrer">ico.org.uk/make-a-complaint</a> · Helpline 0303 123 1113 · Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF. We'd appreciate the chance to resolve your concern first.
        </p>
      </Section>
    </LegalPage>
  );
}