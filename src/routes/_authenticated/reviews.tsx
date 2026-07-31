import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyReviews } from "@/lib/reviews.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { Star, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: ReviewsPage,
  head: () => ({
    meta: [
      { title: "Reviews & reputation · DoneMate" },
      { name: "description", content: "Ratings, reputation tier and customer testimonials on DoneMate." },
    ],
  }),
});

function tierFor(count: number, avg: number) {
  if (count >= 100 && avg >= 4.8) return { name: "Diamond", color: "#7DD3FC" };
  if (count >= 50 && avg >= 4.6) return { name: "Platinum", color: "#94A3B8" };
  if (count >= 20 && avg >= 4.4) return { name: "Gold", color: "#F5B301" };
  if (count >= 5 && avg >= 4.0) return { name: "Silver", color: "#CBD5E1" };
  return { name: "Bronze", color: "#C97B4A" };
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-[#F5B301] text-[#F5B301]" : "text-[#E5E7EB]"}`} />
      ))}
    </div>
  );
}

function ReviewsPage() {
  const { profile } = useAuth();
  const isProvider = profile?.type === "provider";
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: () => getMyReviews() });
  if (isLoading) return <LoadingScreen />;

  const received = data?.received ?? [];
  const given = data?.given ?? [];
  const avg = data?.avg ?? 0;
  const count = data?.count ?? 0;
  const tier = tierFor(count, avg);

  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Reviews & reputation</h1>
        <p className="text-[#6b7b8c] mt-1">
          {isProvider ? "Feedback from customers you've served." : "Reviews you've left for providers."}
        </p>
      </header>

      {isProvider && (
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-4xl font-semibold text-[#2e4053]">{avg.toFixed(1)}</div>
            <Stars value={avg} />
            <div className="text-sm text-[#6b7b8c] mt-1">{count} review{count === 1 ? "" : "s"}</div>
          </div>
          <div className="h-14 w-px bg-[#E5E7EB]" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full grid place-items-center" style={{ background: `${tier.color}33` }}>
              <Award className="h-6 w-6" style={{ color: tier.color }} />
            </div>
            <div>
              <div className="text-xs uppercase text-[#6b7b8c] tracking-wide">Current tier</div>
              <div className="font-semibold text-[#2e4053]">{tier.name}</div>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-semibold text-[#2e4053] mb-3">
          {isProvider ? `Received (${received.length})` : `Given (${given.length})`}
        </h2>
        <div className="space-y-3">
          {(isProvider ? received : given).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6b7b8c]">
              No reviews yet.
            </div>
          ) : (
            (isProvider ? received : given).map((r: any) => (
              <div key={r.id} className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-[#2e4053]">{r.job?.title ?? "Job"}</div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-[#4a5563] mt-2">{r.comment}</p>}
                <p className="text-xs text-[#6b7b8c] mt-2">{new Date(r.created_at).toLocaleDateString("en-GB")}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  return isProvider ? <ProviderShell>{content}</ProviderShell> : <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{content}</div>;
}