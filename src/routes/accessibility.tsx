import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — DoneMate" },
      { name: "description", content: "How DoneMate works to be accessible to everyone: keyboard navigation, screen readers, colour contrast and how to contact us about accessibility." },
      { property: "og:title", content: "DoneMate Accessibility Statement" },
      { property: "og:description", content: "Our commitment to an accessible marketplace." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  return (
    <LegalPage eyebrow="Legal" title="Accessibility Statement" intro="We want DoneMate to be usable by as many people as possible. This statement explains our approach and how to contact us.">
      <Section heading="Our commitment">
        <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 AA standard across the DoneMate website and app.</p>
      </Section>
      <Section heading="Keyboard navigation">
        <p>All interactive elements can be reached and activated using a keyboard. Focus states are visible on links, buttons and form controls.</p>
      </Section>
      <Section heading="Screen readers">
        <p>We use semantic HTML and ARIA attributes so pages are announced clearly by common screen readers, including VoiceOver, NVDA and TalkBack.</p>
      </Section>
      <Section heading="Colour contrast">
        <p>Text and interactive elements meet or exceed the AA contrast ratio against their background. Colour is never the only way we convey meaning.</p>
      </Section>
      <Section heading="Known limitations">
        <p>We are continually improving. If you encounter a barrier, please let us know so we can fix it.</p>
      </Section>
      <Section heading="Contact us about accessibility">
        <p>Email <a href={`mailto:${COMPANY.accessibilityEmail}`} className="text-primary underline">{COMPANY.accessibilityEmail}</a> or <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>. We aim to respond within 5 working days.</p>
      </Section>
    </LegalPage>
  );
}