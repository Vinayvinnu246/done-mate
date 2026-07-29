import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press — DoneToday" },
      { name: "description", content: "Media enquiries and brand assets for DoneToday, operated by EAGLERA LTD." },
      { property: "og:title", content: "DoneToday Press" },
      { property: "og:description", content: "Media enquiries and brand assets." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PressPage,
});

function PressPage() {
  return (
    <LegalPage eyebrow="Press" title="Media enquiries." intro="For interviews, comment or brand assets, please get in touch.">
      <Section heading="Contact">
        <p>Email <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a> with "Press" in the subject line and a member of the EAGLERA LTD team will respond.</p>
      </Section>
    </LegalPage>
  );
}