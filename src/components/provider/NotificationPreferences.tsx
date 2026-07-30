import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateNotificationPreferences } from "@/lib/notifications.functions";
import { getMyProfile } from "@/lib/profile.functions";

const CHANNELS = [
  { key: "in_app", label: "In-app notifications" },
  { key: "email", label: "Email notifications" },
  { key: "push", label: "Push notifications" },
] as const;

const TOPICS = [
  { key: "new_jobs", label: "New job alerts" },
  { key: "messages", label: "New message alerts" },
  { key: "bookings", label: "Booking alerts" },
  { key: "payments", label: "Payment alerts" },
  { key: "reviews", label: "Review alerts" },
] as const;

type Prefs = Record<string, boolean>;

export function NotificationPreferences() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
  });

  const [prefs, setPrefs] = useState<Prefs>({});
  const [radius, setRadius] = useState<number>(15);
  const [limit, setLimit] = useState<number>(50);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const p = (profile as any).notification_preferences ?? {};
    setPrefs(p);
    setRadius((profile as any).service_radius ?? 15);
    setLimit((profile as any).daily_notification_limit ?? 50);
    setAvailable((profile as any).is_available ?? true);
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateNotificationPreferences({
        data: {
          preferences: prefs,
          service_radius: radius,
          daily_notification_limit: limit,
          is_available: available,
        },
      }),
    onSuccess: () => {
      toast.success("Notification preferences saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save preferences"),
  });

  const on = (key: string) => prefs[key] !== false;
  const toggle = (key: string, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-[#2e4053]">
        Notification preferences
      </h2>
      <p className="mt-1 text-sm text-[#6b7b8c]">
        Choose how and when DoneToday alerts you about work.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a0a8b3]">
            Channels
          </p>
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={c.key} className="text-sm font-normal text-[#4a5563]">
                {c.label}
              </Label>
              <Switch
                id={c.key}
                checked={on(c.key)}
                onCheckedChange={(v) => toggle(c.key, v)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a0a8b3]">
            Alert types
          </p>
          {TOPICS.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={t.key} className="text-sm font-normal text-[#4a5563]">
                {t.label}
              </Label>
              <Switch
                id={t.key}
                checked={on(t.key)}
                onCheckedChange={(v) => toggle(t.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-[#E5E7EB] pt-6 sm:grid-cols-3">
        <div>
          <Label htmlFor="radius" className="text-sm text-[#4a5563]">
            Maximum travel distance (miles)
          </Label>
          <Input
            id="radius"
            type="number"
            min={1}
            max={200}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="limit" className="text-sm text-[#4a5563]">
            Daily job alert limit
          </Label>
          <Input
            id="limit"
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-start">
          <Label htmlFor="available" className="text-sm text-[#4a5563]">
            Currently accepting jobs
          </Label>
          <Switch id="available" checked={available} onCheckedChange={setAvailable} />
        </div>
      </div>

      <Button
        className="mt-6 rounded-full bg-[#59914c] hover:bg-[#4a7d3f]"
        onClick={() => save.mutate()}
        disabled={save.isPending}
      >
        {save.isPending ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}
