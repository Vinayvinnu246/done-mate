import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications · DoneToday Provider Portal" },
      { name: "description", content: "Job alerts, reminders and booking updates in one place." },
      { property: "og:title", content: "Notifications · DoneToday" },
      { property: "og:description", content: "Job alerts, reminders and booking updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function NotificationsPage() {
  const { items, unread, isLoading, markAllRead } = useNotifications();
  return (
    <ProviderShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Notifications</h1>
          <p className="text-[#6b7b8c] text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        )}
      </div>
      <div className="rounded-2xl bg-white border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
        {isLoading ? (
          <p className="p-8 text-center text-[#6b7b8c]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-[#6b7b8c]">Nothing here yet.</p>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`p-4 ${n.read_at ? "" : "bg-[#FAFAF8]"}`}>
              <p className="font-medium text-[#2e4053]">{n.title}</p>
              <p className="text-sm text-[#4a5563]">{n.message}</p>
              <p className="text-xs text-[#a0a8b3] mt-1">
                {new Date(n.created_at).toLocaleString("en-GB")}
              </p>
            </div>
          ))
        )}
      </div>
    </ProviderShell>
  );
}