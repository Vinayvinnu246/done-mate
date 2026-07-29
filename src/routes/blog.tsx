import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — DoneToday" },
      { name: "description", content: "News, tips and stories from the DoneToday team and our community of local pros." },
      { property: "og:title", content: "DoneToday Blog" },
      { property: "og:description", content: "News and stories from DoneToday." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <LegalPage eyebrow="Blog" title="Coming soon." intro="We're working on stories, tips and product updates from the DoneToday team. Check back soon.">
      <Section heading="Stay in the loop">
        <p>Want to be notified when we publish? Drop us a line at <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>.</p>
      </Section>
    </LegalPage>
  );
}