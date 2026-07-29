import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAvailableJobs, getMyJobs } from "@/lib/jobs.functions";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin, PoundSterling, Plus, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  posted: "bg-emerald-100 text-emerald-700",
  quoting: "bg-blue-100 text-blue-700",
  accepted: "bg-amber-100 text-amber-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-[#59914c] text-white",
  cancelled: "bg-red-100 text-red-700",
  disputed: "bg-rose-100 text-rose-700",
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function JobsPage() {
  const { profile } = useAuth();
  const isProvider = profile?.type === "provider";

  const myJobsQuery = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => getMyJobs(),
    enabled: !isProvider,
  });

  const availableJobsQuery = useQuery({
    queryKey: ["available-jobs"],
    queryFn: () => getAvailableJobs(),
    enabled: isProvider,
  });

  if (myJobsQuery.isLoading || availableJobsQuery.isLoading) return <LoadingScreen />;

  const jobs = isProvider ? availableJobsQuery.data ?? [] : myJobsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#2e4053]">
              {isProvider ? "Available jobs" : "My jobs"}
            </h1>
            <p className="text-[#6b7b8c] mt-1">
              {isProvider
                ? "Browse jobs posted by customers in your area."
                : "Track your active jobs and see incoming quotes."}
            </p>
          </div>
          {!isProvider && (
            <Button asChild className="rounded-full">
              <Link to="/post-job">
                <Plus className="h-4 w-4 mr-1.5" />
                Post job
              </Link>
            </Button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB]">
            <Briefcase className="h-10 w-10 text-[#9ca3af] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2e4053]">
              {isProvider ? "No jobs available right now" : "No jobs yet"}
            </h3>
            <p className="text-[#6b7b8c] mt-1 max-w-md mx-auto">
              {isProvider
                ? "Check back soon — new jobs are posted every day."
                : "Post your first job to start receiving quotes from verified professionals."}
            </p>
            {!isProvider && (
              <Button asChild className="mt-6 rounded-full">
                <Link to="/post-job">Post a job</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to="/jobs/$jobId"
                params={{ jobId: job.id }}
                className="block bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusColors[job.status] ?? "bg-slate-100 text-slate-700"}>
                        {job.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-[#6b7b8c]">{job.category?.name ?? "General"}</span>
                    </div>
                    <h3 className="font-semibold text-[#2e4053] text-lg truncate">{job.title}</h3>
                    <p className="text-[#6b7b8c] text-sm mt-1 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#6b7b8c]">
                      {job.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.city}
                        </span>
                      )}
                      {job.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.scheduled_date)}
                        </span>
                      )}
                      {(job.budget_min || job.budget_max) && (
                        <span className="flex items-center gap-1">
                          <PoundSterling className="h-4 w-4" />
                          {job.budget_min ? `£${job.budget_min}` : "Up to"}
                          {job.budget_min && job.budget_max ? " - " : ""}
                          {job.budget_max ? `£${job.budget_max}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isProvider && (
                    <div className="text-right hidden sm:block">
                      <span className="text-2xl font-semibold text-[#2e4053]">
                        {job.quotes?.length ?? 0}
                      </span>
                      <p className="text-xs text-[#6b7b8c]">quotes</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
