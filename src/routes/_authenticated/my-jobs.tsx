import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  PoundSterling,
  Wrench,
} from "lucide-react";

import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageThread } from "@/components/messages/MessageThread";
import { JobPhotoUploader } from "@/components/provider/JobPhotoUploader";
import { useAuth } from "@/hooks/use-auth";
import {
  CANCELLATION_REASONS,
  cancelAssignedJob,
  listAssignedJobs,
  rescheduleAssignedJob,
  updateBookingStatus,
  updateJobWorkDetails,
} from "@/lib/my-jobs.functions";

export const Route = createFileRoute("/_authenticated/my-jobs")({
  component: MyJobsPage,
  head: () => ({
    meta: [
      { title: "My Jobs · DoneToday Provider Portal" },
      {
        name: "description",
        content:
          "Manage every job assigned to you: confirm bookings, update live status, upload photos and track completion.",
      },
      { property: "og:title", content: "My Jobs · DoneToday Provider Portal" },
      {
        property: "og:description",
        content: "Track assigned jobs, live status updates and reminders in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Job = Awaited<ReturnType<typeof listAssignedJobs>>[number];

const STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending",
  provider_selected: "Provider selected",
  assigned: "New assignment",
  confirmed: "Confirmed",
  upcoming: "Upcoming",
  on_the_way: "On my way",
  arrived: "Arrived",
  in_progress: "Work started",
  provider_completed: "Awaiting customer confirmation",
  customer_confirmed: "Customer confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
  unable_to_complete: "Unable to complete",
};

const SECTIONS = [
  "New Assignments",
  "Upcoming",
  "Today",
  "In Progress",
  "Completed",
  "Cancelled",
  "Disputed",
] as const;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function jobStart(job: Job) {
  const iso = job.scheduled_start_datetime ?? job.scheduled_date;
  return iso ? new Date(iso) : null;
}

function sectionFor(job: Job): (typeof SECTIONS)[number] {
  const s = job.booking_status;
  if (s === "cancelled") return "Cancelled";
  if (s === "disputed" || s === "unable_to_complete") return "Disputed";
  if (["provider_completed", "customer_confirmed", "completed"].includes(s)) return "Completed";
  if (["on_the_way", "arrived", "in_progress"].includes(s)) return "In Progress";
  if (s === "assigned") return "New Assignments";
  const start = jobStart(job);
  if (start && isSameDay(start, new Date())) return "Today";
  return "Upcoming";
}

function fmt(job: Job, opts?: Intl.DateTimeFormatOptions) {
  const start = jobStart(job);
  if (!start) return "Date to be agreed";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: job.timezone ?? "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(start);
}

function MyJobsPage() {
  const { user, profile, isLoading } = useAuth();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("New Assignments");

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["assigned-jobs"],
    queryFn: () => listAssignedJobs(),
    enabled: !!user,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const s of SECTIONS) map.set(s, []);
    for (const job of jobs) map.get(sectionFor(job))!.push(job);
    return map;
  }, [jobs]);

  if (isLoading) return <LoadingScreen />;

  if (profile && profile.type !== "provider") {
    return (
      <ProviderShell>
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#2e4053]">My Jobs</h1>
          <p className="text-[#6b7b8c] mt-2">This area is for service providers.</p>
        </div>
      </ProviderShell>
    );
  }

  return (
    <ProviderShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">My Jobs</h1>
          <p className="text-[#6b7b8c] mt-1 text-sm">
            Every job assigned to you, with live status updates and customer details.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-[#E5E7EB] bg-white p-1">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                view === v ? "bg-[#2e4053] text-white" : "text-[#4a5563]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loadingJobs ? (
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 text-center text-[#6b7b8c]">
          Loading your jobs…
        </div>
      ) : view === "calendar" ? (
        <CalendarView jobs={jobs} />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                  section === s
                    ? "border-[#2e4053] bg-[#2e4053] text-white"
                    : "border-[#E5E7EB] bg-white text-[#4a5563]"
                }`}
              >
                {s} ({grouped.get(s)?.length ?? 0})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(grouped.get(section) ?? []).length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-10 text-center text-[#6b7b8c]">
                No jobs in “{section}” right now.
              </div>
            ) : (
              (grouped.get(section) ?? []).map((job) => (
                <JobCard key={job.id} job={job} currentUserId={user?.id ?? ""} />
              ))
            )}
          </div>
        </>
      )}
    </ProviderShell>
  );
}

function CalendarView({ jobs }: { jobs: Job[] }) {
  const [mode, setMode] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(new Date());

  const range = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (mode === "day") end.setDate(end.getDate() + 1);
    if (mode === "week") {
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
    }
    if (mode === "month") {
      start.setDate(1);
      end.setTime(start.getTime());
      end.setMonth(end.getMonth() + 1);
    }
    return { start, end };
  }, [anchor, mode]);

  const visible = jobs
    .filter((j) => {
      const s = jobStart(j);
      return s && s >= range.start && s < range.end;
    })
    .sort((a, b) => (jobStart(a)!.getTime() - jobStart(b)!.getTime()));

  const shift = (dir: number) => {
    const next = new Date(anchor);
    if (mode === "day") next.setDate(next.getDate() + dir);
    if (mode === "week") next.setDate(next.getDate() + dir * 7);
    if (mode === "month") next.setMonth(next.getMonth() + dir);
    setAnchor(next);
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-full border border-[#E5E7EB] p-1">
          {(["day", "week", "month"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                mode === m ? "bg-[#59914c] text-white" : "text-[#4a5563]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shift(-1)}>
            Previous
          </Button>
          <span className="text-sm text-[#4a5563]">
            {range.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
            {new Date(range.end.getTime() - 1).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <Button variant="outline" size="sm" onClick={() => shift(1)}>
            Next
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-[#6b7b8c] py-10">No jobs scheduled in this period.</p>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {visible.map((job) => (
            <li key={job.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[#2e4053] truncate">{job.title}</p>
                <p className="text-xs text-[#6b7b8c]">
                  {fmt(job)} · {job.postcode ?? "—"}
                </p>
              </div>
              <Badge variant="secondary">{STATUS_LABEL[job.booking_status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobCard({ job, currentUserId }: { job: Job; currentUserId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["assigned-jobs"] });

  const status = useMutation({
    mutationFn: (vars: { status: Parameters<typeof updateBookingStatus>[0] extends never ? never : string; note?: string }) =>
      updateBookingStatus({ data: { job_id: job.id, status: vars.status as never, note: vars.note } }),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated — the customer has been notified");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update status"),
  });

  const address = [job.address_line1, job.address_line2, job.city, job.postcode]
    .filter(Boolean)
    .join(", ");
  const confirmedDetails = !!job.address_line1;
  const closed = ["completed", "customer_confirmed", "cancelled", "disputed", "unable_to_complete"].includes(
    job.booking_status,
  );

  const nextActions: { label: string; status: string }[] = [];
  if (job.booking_status === "assigned") nextActions.push({ label: "Confirm job", status: "confirmed" });
  if (["assigned", "confirmed", "upcoming"].includes(job.booking_status))
    nextActions.push({ label: "On my way", status: "on_the_way" });
  if (["on_the_way", "confirmed"].includes(job.booking_status))
    nextActions.push({ label: "Arrived", status: "arrived" });
  if (["arrived", "on_the_way"].includes(job.booking_status))
    nextActions.push({ label: "Work started", status: "in_progress" });

  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[#6b7b8c]">{job.job_ref ?? "—"}</span>
            <Badge variant="outline">{(job.category as { name?: string } | null)?.name ?? "Service"}</Badge>
            <Badge>{STATUS_LABEL[job.booking_status] ?? job.booking_status}</Badge>
            <Badge variant="secondary">Payment: {job.payment_status}</Badge>
          </div>
          <h3 className="font-display text-lg font-semibold text-[#2e4053]">{job.title}</h3>
          <p className="text-sm text-[#6b7b8c]">{job.customer.display_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-[#2e4053]">
            {job.agreed_price != null ? `£${Number(job.agreed_price).toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-[#6b7b8c]">Agreed price</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-[#4a5563]">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#59914c]" /> {fmt(job)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#59914c]" />
          {job.estimated_duration_minutes ? `${job.estimated_duration_minutes} min estimated` : "Duration TBC"}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#59914c]" />
          {confirmedDetails ? address : `${job.city ?? ""} ${job.postcode ?? ""} (full address after confirmation)`}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#59914c]" />
          {job.customer.phone ?? "Available after booking confirmation"}
        </p>
      </div>

      {job.customer_instructions && (
        <p className="mt-3 rounded-xl bg-[#FAFAF8] p-3 text-sm text-[#4a5563]">
          <strong>Customer instructions:</strong> {job.customer_instructions}
        </p>
      )}
      {job.materials_info && (
        <p className="mt-2 rounded-xl bg-[#FAFAF8] p-3 text-sm text-[#4a5563]">
          <Wrench className="inline h-3.5 w-3.5 mr-1" />
          <strong>Materials:</strong> {job.materials_info}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!closed &&
          nextActions.map((a) => (
            <Button
              key={a.status}
              size="sm"
              onClick={() => status.mutate({ status: a.status })}
              disabled={status.isPending}
            >
              {a.label}
            </Button>
          ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              View details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {job.job_ref} · {job.title}
              </DialogTitle>
            </DialogHeader>
            <JobDetails job={job} currentUserId={currentUserId} onDone={invalidate} />
          </DialogContent>
        </Dialog>

        {address && (
          <Button size="sm" variant="outline" asChild>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation className="h-4 w-4 mr-1" /> Get directions
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function JobDetails({
  job,
  currentUserId,
  onDone,
}: {
  job: Job;
  currentUserId: string;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState(job.provider_notes ?? "");
  const [materials, setMaterials] = useState(job.materials_info ?? "");
  const [before, setBefore] = useState<string[]>(job.before_photos ?? []);
  const [after, setAfter] = useState<string[]>(job.after_photos ?? []);
  const [completionNote, setCompletionNote] = useState("");
  const [reason, setReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [cancelDetails, setCancelDetails] = useState("");
  const [newDate, setNewDate] = useState("");

  const closed = ["completed", "customer_confirmed", "cancelled", "disputed", "unable_to_complete"].includes(
    job.booking_status,
  );

  const save = useMutation({
    mutationFn: (vars: {
      job_id: string;
      before_photos?: string[];
      after_photos?: string[];
      provider_notes?: string;
      materials_info?: string;
    }) => updateJobWorkDetails({ data: vars }),
    onSuccess: () => {
      onDone();
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const complete = useMutation({
    mutationFn: () =>
      updateBookingStatus({
        data: { job_id: job.id, status: "provider_completed", note: completionNote },
      }),
    onSuccess: () => {
      onDone();
      toast.success("Marked complete — the customer has been asked to confirm and review");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not complete"),
  });

  const unable = useMutation({
    mutationFn: () =>
      updateBookingStatus({
        data: { job_id: job.id, status: "unable_to_complete", note: completionNote },
      }),
    onSuccess: () => {
      onDone();
      toast.success("Reported — our support team will follow up");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not report"),
  });

  const cancel = useMutation({
    mutationFn: () =>
      cancelAssignedJob({
        data: { job_id: job.id, reason: reason as never, details: cancelDetails || undefined },
      }),
    onSuccess: () => {
      onDone();
      toast.success("Job cancelled — the customer and our team have been notified");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not cancel"),
  });

  const reschedule = useMutation({
    mutationFn: () =>
      rescheduleAssignedJob({
        data: { job_id: job.id, scheduled_start_datetime: newDate },
      }),
    onSuccess: () => {
      onDone();
      toast.success("Rescheduled — reminders have been reset and both parties notified");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not reschedule"),
  });

  return (
    <Tabs defaultValue="work" className="mt-2">
      <TabsList className="w-full">
        <TabsTrigger value="work" className="flex-1">
          Work
        </TabsTrigger>
        <TabsTrigger value="messages" className="flex-1">
          Messages
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex-1">
          Manage
        </TabsTrigger>
      </TabsList>

      <TabsContent value="work" className="space-y-4 pt-4">
        <p className="text-sm text-[#4a5563] whitespace-pre-line">{job.description}</p>

        <JobPhotoUploader
          jobId={job.id}
          label="Before photos"
          paths={before}
          disabled={closed}
          onChange={(p) => {
            setBefore(p);
            save.mutate({ job_id: job.id, before_photos: p });
          }}
        />
        <JobPhotoUploader
          jobId={job.id}
          label="After photos"
          paths={after}
          disabled={closed}
          onChange={(p) => {
            setAfter(p);
            save.mutate({ job_id: job.id, after_photos: p });
          }}
        />

        <div>
          <Label className="text-xs">Materials used</Label>
          <Textarea value={materials} onChange={(e) => setMaterials(e.target.value)} rows={2} />
        </div>
        <div>
          <Label className="text-xs">Your notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({ job_id: job.id, provider_notes: notes, materials_info: materials })
          }
        >
          Save notes
        </Button>

        {!closed && (
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-2">
            <Label className="text-xs">Completion notes</Label>
            <Textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={2}
              placeholder="What was done, anything the customer should know…"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={complete.isPending || after.length === 0}
                onClick={() => complete.mutate()}
              >
                Mark work completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={unable.isPending}
                onClick={() => unable.mutate()}
              >
                Unable to complete
              </Button>
            </div>
            {after.length === 0 && (
              <p className="text-xs text-[#6b7b8c]">Upload at least one after photo to complete the job.</p>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="messages" className="pt-4">
        <MessageThread
          jobId={job.id}
          providerId={currentUserId}
          currentUserId={currentUserId}
          otherName={job.customer.display_name}
        />
      </TabsContent>

      <TabsContent value="manage" className="space-y-5 pt-4">
        <div className="space-y-2">
          <Label className="text-xs">Request reschedule</Label>
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            disabled={closed}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!newDate || reschedule.isPending || closed}
            onClick={() => reschedule.mutate()}
          >
            Reschedule
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Cancel this job</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANCELLATION_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            rows={2}
            value={cancelDetails}
            onChange={(e) => setCancelDetails(e.target.value)}
            placeholder="Add any detail for the customer and our team"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={cancel.isPending || closed}
            onClick={() => cancel.mutate()}
          >
            Cancel job
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Report a problem</Label>
          <Button size="sm" variant="outline" asChild>
            <a href="/support">
              <MessageSquare className="h-4 w-4 mr-1" /> Contact support
            </a>
          </Button>
        </div>

        <p className="text-xs text-[#6b7b8c] flex items-center gap-1">
          <PoundSterling className="h-3.5 w-3.5" />
          Payment status: {job.payment_status}
        </p>
      </TabsContent>
    </Tabs>
  );
}