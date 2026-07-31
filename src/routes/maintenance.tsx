import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Scheduled maintenance — DoneMate" },
      { name: "description", content: "DoneMate is temporarily unavailable for scheduled maintenance. We'll be back shortly." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Scheduled maintenance" },
      { property: "og:description", content: "DoneMate is briefly offline for maintenance." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <LegalPage
      eyebrow="Maintenance"
      title="We'll be back shortly"
      intro="DoneMate is temporarily offline for scheduled maintenance. Thanks for your patience."
    >
      <p className="text-sm text-muted-foreground">
        For urgent booking issues, email <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a> and we'll help as soon as we're back online.
      </p>
    </LegalPage>
  );
}