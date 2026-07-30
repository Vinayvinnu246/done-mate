import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProviderById } from "@/lib/providers.functions";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeCheck, Clock, MapPin, Star } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/providers/$providerId")({
  component: ProviderProfilePage,
  head: () => ({
    meta: [
      { title: "Provider profile — DoneToday" },
      {
        name: "description",
        content:
          "Verified DoneToday provider profile with specialties, experience and service area.",
      },
      { property: "og:title", content: "Provider profile — DoneToday" },
      {
        property: "og:description",
        content: "Book a verified professional on DoneToday.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProviderProfilePage() {
  const { providerId } = Route.useParams();
  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => getProviderById({ data: providerId }),
  });

  if (isLoading) return <LoadingScreen />;
  if (!provider) throw notFound();

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <BackButton
          fallbackTo="/providers"
          label="Back to providers"
          className="mb-6"
        />

        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-2xl bg-[#F1F2F4] flex items-center justify-center text-3xl font-semibold text-[#2e4053] overflow-hidden shrink-0">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (provider.display_name ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-semibold text-[#2e4053]">
                  {provider.display_name ?? "DoneToday provider"}
                </h1>
                {provider.verification_status === "verified" && (
                  <BadgeCheck className="h-6 w-6 text-[#59914c]" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#6b7b8c]">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  New on DoneToday
                </span>
                {provider.years_experience != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {provider.years_experience}+ years experience
                  </span>
                )}
                {provider.service_radius != null && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Serves within {provider.service_radius} miles
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {provider.categories.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="bg-[#F1F2F4] text-[#2e4053] font-normal"
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {provider.bio && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-[#2e4053] mb-2">About</h2>
              <p className="text-[#6b7b8c] leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row gap-3">
            <Button asChild className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]">
              <Link to="/post-job">Post a job to invite quotes</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/auth" search={{ mode: "login", next: "/providers" }}>
                Sign in to message
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}