import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — DoneMate" },
      { name: "description", content: "Join EAGLERA LTD and help build DoneMate — the UK's most trusted marketplace for local pros." },
      { property: "og:title", content: "Careers at DoneMate" },
      { property: "og:description", content: "Open roles and how to apply." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <LegalPage eyebrow="Careers" title="Build the future of local services." intro="We're a small, ambitious team at EAGLERA LTD building DoneMate from London. We'd love to hear from designers, engineers and operators who want to help.">
      <Section heading="Open roles">
        <p>We don't have any public roles right now, but we're always keen to meet great people. Send a note and your CV to <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a> with the subject line "Careers".</p>
      </Section>
    </LegalPage>
  );
}