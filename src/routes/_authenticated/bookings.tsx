import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, updateJobStatus } from "@/lib/jobs.functions";
import { createReview } from "@/lib/reviews.functions";
import { createDispute } from "@/lib/disputes.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar, MapPin, PoundSterling, CheckCircle2, PlayCircle, XCircle, Star, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [
      { title: "Bookings · DoneMate" },
      { name: "description", content: "Manage accepted jobs and track progress on DoneMate." },
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

  const [reviewFor, setReviewFor] = useState<any>(null);
  const [disputeFor, setDisputeFor] = useState<any>(null);

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
              onDispute={() => setDisputeFor(j)}
            />
          ))
        )}
      </Section>

      <Section title={`Past (${past.length})`}>
        {past.length === 0 ? (
          <Empty message="No past bookings." />
        ) : (
          past.map((j: any) => (
            <BookingCard
              key={j.id}
              job={j}
              isProvider={isProvider}
              readOnly
              onReview={!isProvider && j.status === "completed" ? () => setReviewFor(j) : undefined}
            />
          ))
        )}
      </Section>
    </div>
  );

  const wrapped = isProvider ? <ProviderShell>{content}</ProviderShell> : <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{content}</div>;
  return (
    <>
      {wrapped}
      {reviewFor && <ReviewDialog job={reviewFor} onClose={() => setReviewFor(null)} />}
      {disputeFor && <DisputeDialog job={disputeFor} onClose={() => setDisputeFor(null)} />}
    </>
  );
}

function ReviewDialog({ job, onClose }: { job: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const acceptedQuote = job.myQuote ?? (job.quotes ?? []).find((q: any) => q.status === "accepted");
  const providerId = acceptedQuote?.provider_id;
  const m = useMutation({
    mutationFn: () => createReview({ data: { job_id: job.id, provider_id: providerId, rating, comment: comment || undefined } }),
    onSuccess: () => { toast.success("Review submitted"); qc.invalidateQueries({ queryKey: ["my-bookings"] }); onClose(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Leave a review</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star className={`h-8 w-8 ${n <= rating ? "fill-[#F5B301] text-[#F5B301]" : "text-[#E5E7EB]"}`} />
              </button>
            ))}
          </div>
          <Textarea rows={4} placeholder="How did it go?" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="bg-[#59914c] hover:bg-[#4a7d3f]" disabled={m.isPending || !providerId} onClick={() => m.mutate()}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DisputeDialog({ job, onClose }: { job: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const m = useMutation({
    mutationFn: () => createDispute({ data: { job_id: job.id, reason, description: description || undefined } }),
    onSuccess: () => { toast.success("Dispute opened"); qc.invalidateQueries({ queryKey: ["my-bookings"] }); onClose(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Open a dispute</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Reason (e.g. Work not completed)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Textarea rows={4} placeholder="Describe what went wrong…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="bg-[#B91C1C] hover:bg-[#991B1B]" disabled={m.isPending || reason.trim().length < 3} onClick={() => m.mutate()}>Open dispute</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  onReview,
  onDispute,
}: {
  job: any;
  isProvider: boolean;
  onAction?: (status: "in_progress" | "completed" | "cancelled") => void;
  pending?: boolean;
  readOnly?: boolean;
  onReview?: () => void;
  onDispute?: () => void;
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
          {onDispute && (
            <Button size="sm" variant="outline" className="rounded-full text-[#B91C1C] border-[#FCA5A5] hover:bg-[#FEF2F2]" onClick={onDispute}>
              <AlertTriangle className="h-4 w-4 mr-1" /> Dispute
            </Button>
          )}
        </div>
      )}
      {readOnly && onReview && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]" onClick={onReview}>
            <Star className="h-4 w-4 mr-1" /> Leave review
          </Button>
        </div>
      )}
    </div>
  );
}