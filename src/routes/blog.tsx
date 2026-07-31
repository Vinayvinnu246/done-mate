import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — DoneMate" },
      { name: "description", content: "News, tips and stories from the DoneMate team and our community of local pros." },
      { property: "og:title", content: "DoneMate Blog" },
      { property: "og:description", content: "News and stories from DoneMate." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <LegalPage eyebrow="Blog" title="Coming soon." intro="We're working on stories, tips and product updates from the DoneMate team. Check back soon.">
      <Section heading="Stay in the loop">
        <p>Want to be notified when we publish? Drop us a line at <a href="mailto:support@donemate.co.uk" className="text-primary underline">support@donemate.co.uk</a>.</p>
      </Section>
    </LegalPage>
  );
}