import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About DoneToday — Local pros, done today" },
      { name: "description", content: "DoneToday, operated by EAGLERA LTD, connects UK households with verified local professionals for cleaning, plumbing, gardening and more." },
      { property: "og:title", content: "About DoneToday" },
      { property: "og:description", content: "The story behind DoneToday, the UK marketplace for trusted local professionals." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalPage eyebrow="About us" title="Local pros, done today." intro="DoneToday is a UK marketplace that helps households and businesses book verified local professionals in minutes — with real quotes, secure payments and honest reviews.">
      <Section heading="Our mission">
        <p>We believe getting help at home should feel as simple as ordering a taxi. DoneToday removes the guesswork, phone tag and awkward pricing from finding a great local pro — replacing it with transparent quotes, verified identities and money-back protection.</p>
      </Section>
      <Section heading="What we do">
        <p>From leaky taps and overgrown gardens to deep cleans, small builds and last-minute removals, we connect customers with vetted providers nearby. Every pro on the platform is ID-verified and insurance-checked, and every job is protected by our secure escrow payments.</p>
      </Section>
      <Section heading="Who we are">
        <p>DoneToday is a trading name of <strong>EAGLERA LTD</strong>, a company registered in England &amp; Wales. We are headquartered in London and operate across the United Kingdom, with plans to expand across Europe and beyond.</p>
        <p>Questions, partnerships or press? <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a></p>
      </Section>
    </LegalPage>
  );
}