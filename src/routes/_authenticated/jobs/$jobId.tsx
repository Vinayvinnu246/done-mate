import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { createQuote, getJobById, updateQuoteStatus } from "@/lib/jobs.functions";
import { ArrowLeft, Calendar, MapPin, PoundSterling, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  component: JobDetailPage,
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

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const isProvider = profile?.type === "provider";

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById({ data: jobId }),
  });

  const quoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      toast.success("Quote sent successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send quote");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: updateQuoteStatus,
    onSuccess: () => {
      toast.success("Quote accepted");
      navigate({ to: "/jobs" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to accept quote");
    },
  });

  const [quotePrice, setQuotePrice] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");

  if (isLoading || !job) return <LoadingScreen />;

  const isCustomer = job.customer_id === user?.id;
  const hasQuoted = job.quotes?.some((q) => q.provider_id === user?.id);
  const acceptedQuote = job.quotes?.find((q) => q.status === "accepted");

  function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quotePrice || isNaN(Number(quotePrice))) {
      toast.error("Enter a valid price");
      return;
    }
    quoteMutation.mutate({
      data: {
        job_id: job.id,
        price: Number(quotePrice),
        duration_minutes: quoteDuration ? Number(quoteDuration) : undefined,
        message: quoteMessage,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate({ to: "/jobs" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to jobs
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={statusColors[job.status] ?? "bg-slate-100 text-slate-700"}>
                  {job.status.replace("_", " ")}
                </Badge>
                <span className="text-sm text-[#6b7b8c]">{job.category?.name ?? "General"}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">
                {job.title}
              </h1>
              <p className="text-[#6b7b8c] mt-3 leading-relaxed">{job.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-[#6b7b8c]">
                {job.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.address_line1}, {job.city}, {job.postcode}
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

            {isCustomer && job.quotes && job.quotes.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-[#2e4053]">Quotes</h2>
                {job.quotes.map((quote) => (
                  <Card key={quote.id} className="border-[#E5E7EB]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4 text-[#6b7b8c]" />
                          {quote.provider?.display_name ?? "Verified provider"}
                        </CardTitle>
                        <Badge
                          className={
                            quote.status === "accepted"
                              ? "bg-[#59914c] text-white"
                              : quote.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {quote.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-sm text-[#6b7b8c]">Price</p>
                          <p className="text-xl font-semibold text-[#2e4053]">£{quote.price}</p>
                        </div>
                        {quote.duration_minutes && (
                          <div>
                            <p className="text-sm text-[#6b7b8c]">Duration</p>
                            <p className="text-xl font-semibold text-[#2e4053]">
                              {quote.duration_minutes} min
                            </p>
                          </div>
                        )}
                      </div>
                      {quote.message && (
                        <p className="text-sm text-[#6b7b8c]">{quote.message}</p>
                      )}
                      {quote.status === "pending" && job.status === "quoting" && (
                        <div className="flex gap-3">
                          <Button
                            className="rounded-full"
                            onClick={() =>
                              acceptMutation.mutate({ data: { quote_id: quote.id, status: "accepted" } })
                            }
                            disabled={acceptMutation.isPending}
                          >
                            Accept quote
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() =>
                              acceptMutation.mutate({ data: { quote_id: quote.id, status: "rejected" } })
                            }
                            disabled={acceptMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isProvider && job.status === "quoting" && !hasQuoted && !acceptedQuote && (
              <Card className="border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-lg">Submit a quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleQuoteSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Your price (£)</Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Estimated duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={15}
                        value={quoteDuration}
                        onChange={(e) => setQuoteDuration(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        rows={3}
                        value={quoteMessage}
                        onChange={(e) => setQuoteMessage(e.target.value)}
                        placeholder="Introduce yourself and explain your approach."
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full" disabled={quoteMutation.isPending}>
                      {quoteMutation.isPending ? "Sending…" : "Send quote"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {isProvider && hasQuoted && (
              <Card className="border-[#E5E7EB]">
                <CardContent className="p-6">
                  <p className="text-sm text-[#6b7b8c]">
                    You have already submitted a quote for this job. The customer will review it shortly.
                  </p>
                </CardContent>
              </Card>
            )}

            {acceptedQuote && (
              <Card className="border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-lg">Accepted quote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-[#6b7b8c]">
                    Provider: {acceptedQuote.provider?.display_name ?? "Verified provider"}
                  </p>
                  <p className="text-2xl font-semibold text-[#2e4053]">£{acceptedQuote.price}</p>
                  {acceptedQuote.duration_minutes && (
                    <p className="text-sm text-[#6b7b8c]">
                      Estimated duration: {acceptedQuote.duration_minutes} minutes
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
