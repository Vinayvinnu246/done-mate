import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, updateJobStatus } from "@/lib/jobs.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar, MapPin, PoundSterling, CheckCircle2, PlayCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [
      { title: "Bookings · DoneToday" },
      { name: "description", content: "Manage accepted jobs and track progress on DoneToday." },
    ],
  }),
});

const STATUS_STEPS = ["accepted", "in_progress", "completed"] as const;

const STATUS_LABEL: Record<string, string> = {
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function BookingsPage() {
  const { profile } = useAuth();
  const isProvider = profile?.type === "provider";
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => getMyBookings(),
  });

  const mutation = useMutation({
    mutationFn: (v: { job_id: string; status: "in_progress" | "completed" | "cancelled" }) =>
      updateJobStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <LoadingScreen />;

  const jobs = isProvider ? data?.providerJobs ?? [] : data?.customerJobs ?? [];
  const active = jobs.filter((j: any) => ["accepted", "in_progress"].includes(j.status));
  const past = jobs.filter((j: any) => ["completed", "cancelled", "disputed"].includes(j.status));

  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Bookings</h1>
        <p className="text-[#6b7b8c] mt-1">
          {isProvider ? "Jobs you've been booked for." : "Jobs you've booked with providers."}
        </p>
      </header>

      <Section title={`Active (${active.length})`}>
        {active.length === 0 ? (
          <Empty message="No active bookings." />
        ) : (
          active.map((j: any) => (
            <BookingCard
              key={j.id}
              job={j}
              isProvider={isProvider}
              onAction={(s) => mutation.mutate({ job_id: j.id, status: s })}
              pending={mutation.isPending}
            />
          ))
        )}
      </Section>

      <Section title={`Past (${past.length})`}>
        {past.length === 0 ? (
          <Empty message="No past bookings." />
        ) : (
          past.map((j: any) => <BookingCard key={j.id} job={j} isProvider={isProvider} readOnly />)
        )}
      </Section>
    </div>
  );

  return isProvider ? <ProviderShell>{content}</ProviderShell> : <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{content}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-[#2e4053] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6b7b8c]">
      {message}
    </div>
  );
}

function BookingCard({
  job,
  isProvider,
  onAction,
  pending,
  readOnly,
}: {
  job: any;
  isProvider: boolean;
  onAction?: (status: "in_progress" | "completed" | "cancelled") => void;
  pending?: boolean;
  readOnly?: boolean;
}) {
  const currentStep = STATUS_STEPS.indexOf(job.status as any);
  const cancelled = job.status === "cancelled" || job.status === "disputed";
  const acceptedQuote =
    job.myQuote ?? (job.quotes ?? []).find((q: any) => q.status === "accepted");

  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="font-semibold text-[#2e4053] hover:underline block truncate"
          >
            {job.title}
          </Link>
          <p className="text-xs text-[#6b7b8c] mt-1">{job.category?.name}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#2e4053] shrink-0">
          {STATUS_LABEL[job.status] ?? job.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#4a5563]">
        {job.scheduled_date && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(job.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
        {job.postcode && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.postcode}
          </span>
        )}
        {acceptedQuote && (
          <span className="inline-flex items-center gap-1 text-[#2e4053] font-medium">
            <PoundSterling className="h-4 w-4" />
            {Number(acceptedQuote.price).toFixed(2)}
          </span>
        )}
      </div>

      {/* Timeline */}
      {!cancelled && (
        <ol className="mt-4 grid grid-cols-3 gap-2">
          {STATUS_STEPS.map((s, i) => {
            const done = i <= currentStep;
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <div
                  className={`h-8 w-8 rounded-full grid place-items-center ${
                    done ? "bg-[#59914c] text-white" : "bg-[#F3F4F6] text-[#6b7b8c]"
                  }`}
                >
                  {i === 0 && <CheckCircle2 className="h-4 w-4" />}
                  {i === 1 && <PlayCircle className="h-4 w-4" />}
                  {i === 2 && <CheckCircle2 className="h-4 w-4" />}
                </div>
                <span className={`mt-1 text-[10px] ${done ? "text-[#2e4053] font-medium" : "text-[#6b7b8c]"}`}>
                  {STATUS_LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {!readOnly && !cancelled && (
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          {isProvider && job.status === "accepted" && (
            <Button
              size="sm"
              className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]"
              disabled={pending}
              onClick={() => onAction?.("in_progress")}
            >
              Start job
            </Button>
          )}
          {!isProvider && job.status === "in_progress" && (
            <Button
              size="sm"
              className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]"
              disabled={pending}
              onClick={() => onAction?.("completed")}
            >
              Mark completed
            </Button>
          )}
          {!isProvider && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => {
                if (confirm("Cancel this booking?")) onAction?.("cancelled");
              }}
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
              Details
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}