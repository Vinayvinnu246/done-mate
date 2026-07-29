import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";

export const Route = createFileRoute("/_authenticated/support")({
  component: () => (
    <ProviderShell>
      <ComingSoon
        title="Support"
        description="Contact our support team, browse FAQs, and open dispute tickets."
      />
    </ProviderShell>
  ),
  head: () => ({ meta: [{ title: "Support · DoneToday" }] }),
});