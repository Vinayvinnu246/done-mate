import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <ProviderShell>
      <ComingSoon
        title="Settings"
        description="Notifications, password, two-factor authentication and account preferences."
      />
    </ProviderShell>
  ),
  head: () => ({ meta: [{ title: "Settings · DoneToday" }] }),
});