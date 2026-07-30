import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchProviders } from "@/lib/providers.functions";
import { getCategories } from "@/lib/jobs.functions";
import { useBlockProvidersFromCustomerPages } from "@/hooks/use-role-guard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin, Search, Star } from "lucide-react";

type ProvidersSearch = { q: string; category: string; city: string };

export const Route = createFileRoute("/providers")({
  validateSearch: (s: Record<string, unknown>): ProvidersSearch => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
    city: typeof s.city === "string" ? s.city : "",
  }),
  component: ProvidersPage,
  head: () => ({
    meta: [
      { title: "Find trusted local providers — DoneToday" },
      {
        name: "description",
        content:
          "Browse verified cleaners, gardeners, plumbers, electricians and more on DoneToday. Compare providers by rating and specialty.",
      },
      { property: "og:title", content: "Find trusted local providers — DoneToday" },
      {
        property: "og:description",
        content:
          "Verified providers ready to quote on your next job. Browse by category on DoneToday.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProvidersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/providers" });
  const [q, setQ] = useState(search.q);
  const [city, setCity] = useState(search.city);
  const redirectingProvider = useBlockProvidersFromCustomerPages();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", search.q, search.category, search.city],
    queryFn: () =>
      searchProviders({
        data: {
          q: search.q || undefined,
          category_id: search.category || undefined,
          city: search.city || undefined,
        },
      }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: (prev: ProvidersSearch) => ({ ...prev, q, city }) });
  }

  if (redirectingProvider) {
    return <div className="min-h-screen bg-[#FAFAF8]" />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-[#2e4053] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <BackButton className="text-white/70 hover:text-white" />
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-4">
            Find a trusted provider
          </h1>
          <p className="text-white/70 mt-2 max-w-2xl">
            Browse verified professionals near you. Every provider is background-checked and
            reviewed by real customers.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 max-w-3xl"
          >
            <div className="relative">
              <Search className="h-4 w-4 text-[#6b7b8c] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or specialty"
                className="pl-9 h-11 bg-white text-[#2e4053]"
              />
            </div>
            <div className="relative">
              <MapPin className="h-4 w-4 text-[#6b7b8c] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Town or city"
                className="pl-9 h-11 bg-white text-[#2e4053]"
              />
            </div>
            <Button type="submit" className="h-11 rounded-full bg-[#59914c] hover:bg-[#4a7d3f]">
              Search
            </Button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => navigate({ search: (prev: ProvidersSearch) => ({ ...prev, category: "" }) })}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              !search.category
                ? "bg-[#2e4053] text-white border-[#2e4053]"
                : "bg-white text-[#2e4053] border-[#E5E7EB] hover:border-[#2e4053]"
            }`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate({ search: (prev: ProvidersSearch) => ({ ...prev, category: c.id }) })}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                search.category === c.id
                  ? "bg-[#2e4053] text-white border-[#2e4053]"
                  : "bg-white text-[#2e4053] border-[#E5E7EB] hover:border-[#2e4053]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-[#6b7b8c]">Loading providers…</p>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6b7b8c]">No providers match your search yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p) => (
              <Link
                key={p.user_id}
                to="/providers/$providerId"
                params={{ providerId: p.user_id }}
                className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#2e4053] hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#F1F2F4] flex items-center justify-center text-lg font-semibold text-[#2e4053] shrink-0 overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (p.display_name ?? "?").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[#2e4053] truncate">
                        {p.display_name ?? "DoneToday provider"}
                      </p>
                      {p.verification_status === "verified" && (
                        <BadgeCheck className="h-4 w-4 text-[#59914c]" />
                      )}
                    </div>
                    <p className="text-sm text-[#6b7b8c] flex items-center gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      New provider
                    </p>
                  </div>
                </div>
                {p.bio && (
                  <p className="text-sm text-[#6b7b8c] mt-3 line-clamp-2">{p.bio}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {p.categories.slice(0, 3).map((c) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="bg-[#F1F2F4] text-[#2e4053] font-normal"
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}