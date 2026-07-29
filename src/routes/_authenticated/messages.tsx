import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";

export const Route = createFileRoute("/_authenticated/messages")({
  component: () => (
    <ProviderShell>
      <ComingSoon
        title="Messages"
        description="Real-time chat with customers, photo attachments, and quick replies."
      />
    </ProviderShell>
  ),
  head: () => ({ meta: [{ title: "Messages · DoneToday" }] }),
});