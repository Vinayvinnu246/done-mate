import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { ProviderServiceManagement } from "@/components/provider/ProviderServiceManagement";
import { NotificationPreferences } from "@/components/provider/NotificationPreferences";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · DoneToday" }] }),
});

function SettingsPage() {
  const { profile } = useAuth();
  if (!profile) return <LoadingScreen />;
  if (profile.type !== "provider") {
    return (
      <ProviderShell>
        <ComingSoon
          title="Settings"
          description="Notifications, password, two-factor authentication and account preferences."
        />
      </ProviderShell>
    );
  }
  return (
    <ProviderShell>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Your services</h1>
          <p className="text-[#6b7b8c] mt-1 text-sm">Manage every trade you offer, with pricing, qualifications, coverage and portfolio.</p>
        </div>
        <ProviderServiceManagement />
        <div className="mt-8">
          <NotificationPreferences />
        </div>
      </div>
    </ProviderShell>
  );
}