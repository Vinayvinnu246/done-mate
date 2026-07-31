import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/server-error")({
  head: () => ({
    meta: [
      { title: "Something went wrong — DoneMate" },
      { name: "description", content: "This page didn't load. Try refreshing or head back home." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Something went wrong" },
      { property: "og:description", content: "An unexpected error occurred on DoneMate." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServerErrorPage,
});

function ServerErrorPage() {
  return (
    <LegalPage eyebrow="Error 500" title="Something went wrong" intro="An unexpected error occurred on our end. Our team has been notified.">
      <div className="flex flex-wrap gap-3">
        <button onClick={() => window.location.reload()} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
        <Link to="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Go home</Link>
        <Link to="/help" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Help Centre</Link>
      </div>
      <p className="text-sm text-muted-foreground">If the issue persists, email <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">{COMPANY.supportEmail}</a>.</p>
    </LegalPage>
  );
}