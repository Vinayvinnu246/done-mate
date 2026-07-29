import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: () => (
    <ProviderShell>
      <ComingSoon
        title="Reviews & reputation"
        description="Ratings, tier progression (Bronze → Diamond), and testimonials from your customers."
      />
    </ProviderShell>
  ),
  head: () => ({ meta: [{ title: "Reviews · DoneToday" }] }),
});