import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, MapPin, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  unread: "Unread",
  viewed: "Viewed",
  quote_sent: "Quote sent",
  not_interested: "Not interested",
  job_booked: "Job booked",
  job_closed: "Job closed",
  expired: "Expired",
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function NotificationBell() {
  const { items, unread, markRead, markAllRead, updateStatus } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative rounded-full"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#59914c] px-1 text-[11px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0 sm:w-[380px]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button
              className="text-xs font-medium text-[#59914c] hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet. New job alerts land here instantly.
            </p>
          )}

          {items.map((n: any) => {
            const meta = (n.metadata ?? {}) as Record<string, any>;
            const isJobAlert = n.type === "new_job";
            return (
              <div
                key={n.id}
                className={cn(
                  "border-b border-border/60 px-4 py-3 last:border-b-0",
                  !n.read_at && "bg-[#59914c]/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {meta.postcode_area && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {meta.postcode_area}
                      {meta.distance_miles != null && ` · ${meta.distance_miles} mi`}
                    </span>
                  )}
                  {meta.scheduled_date && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(meta.scheduled_date).toLocaleDateString("en-GB")}
                    </span>
                  )}
                  {meta.budget && (
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> {meta.budget}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {STATUS_LABEL[n.status] ?? n.status}
                  </span>
                </div>

                {n.job_id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      <Link to="/jobs/$jobId" params={{ jobId: n.job_id }}>
                        View job
                      </Link>
                    </Button>
                    {isJobAlert && n.status !== "quote_sent" && (
                      <>
                        <Button
                          asChild
                          size="sm"
                          className="h-7 rounded-full bg-[#59914c] px-3 text-xs hover:bg-[#4a7d3f]"
                          onClick={() => markRead.mutate(n.id)}
                        >
                          <Link to="/jobs/$jobId" params={{ jobId: n.job_id }}>
                            Send quote
                          </Link>
                        </Button>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            updateStatus.mutate({ id: n.id, status: "not_interested" })
                          }
                        >
                          Not interested
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
