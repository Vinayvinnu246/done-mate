import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, Section } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — DoneToday" },
      { name: "description", content: "How DoneToday uses cookies and similar technologies to run the platform, keep you signed in and understand usage." },
      { property: "og:title", content: "DoneToday Cookie Policy" },
      { property: "og:description", content: "Our use of cookies and similar technologies." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage eyebrow="Legal" title="Cookie Policy" intro="DoneToday, operated by EAGLERA LTD, uses cookies and similar technologies to run the platform, keep you signed in and understand how the service is used.">
      <Section heading="What are cookies?">
        <p>Cookies are small text files stored on your device when you visit a website. We also use similar technologies like local storage.</p>
      </Section>
      <Section heading="Types of cookies we use">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Essential:</strong> keep you signed in and secure the platform.</li>
          <li><strong>Preferences:</strong> remember your settings, like language.</li>
          <li><strong>Analytics:</strong> help us understand how DoneToday is used.</li>
        </ul>
      </Section>
      <Section heading="Managing cookies">
        <p>You can control cookies through your browser settings. Blocking essential cookies may prevent parts of DoneToday from working correctly.</p>
      </Section>
      <Section heading="Contact">
        <p>Questions? Email <a href="mailto:support@donetoday.co.uk" className="text-primary underline">support@donetoday.co.uk</a>.</p>
      </Section>
    </LegalPage>
  );
}