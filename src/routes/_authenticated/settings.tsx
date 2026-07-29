import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProviderShell, ComingSoon } from "@/components/layout/ProviderShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { getCategories } from "@/lib/jobs.functions";
import {
  getMyProviderProfile,
  listSubcategories,
  updateProviderServices,
} from "@/lib/onboarding.functions";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · DoneToday" }] }),
});

function SettingsPage() {
  const { profile } = useAuth();
  if (!profile) return <LoadingScreen />;
  if (profile.type !== "provider") {
    return (
      <ProviderShell>
        <ComingSoon
          title="Settings"
          description="Notifications, password, two-factor authentication and account preferences."
        />
      </ProviderShell>
    );
  }
  return (
    <ProviderShell>
      <ServicesEditor />
    </ProviderShell>
  );
}

function ServicesEditor() {
  const qc = useQueryClient();
  const providerQ = useQuery({ queryKey: ["provider-profile"], queryFn: () => getMyProviderProfile() });
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const subsQ = useQuery({ queryKey: ["subcategories"], queryFn: () => listSubcategories() });

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!providerQ.data) return;
    const cats = (providerQ.data.provider_categories ?? []).map((r: { category_id: string }) => r.category_id);
    const subs = (providerQ.data.provider_subcategories ?? []).map((r: { subcategory_id: string }) => r.subcategory_id);
    setSelectedCats(cats);
    setSelectedSubs(subs);
    setExpanded(cats);
  }, [providerQ.data]);

  const mutation = useMutation({
    mutationFn: (payload: { category_ids: string[]; subcategory_ids: string[] }) =>
      updateProviderServices({ data: payload }),
    onSuccess: () => {
      toast.success("Services updated");
      qc.invalidateQueries({ queryKey: ["provider-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const cats = catsQ.data ?? [];
  const subs = subsQ.data ?? [];
  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(q));
  }, [cats, search]);

  function toggleCat(id: string) {
    setSelectedCats((prev) => {
      const has = prev.includes(id);
      if (has) {
        setSelectedSubs((s) => s.filter((sid) => subs.find((x) => x.id === sid)?.category_id !== id));
        return prev.filter((x) => x !== id);
      }
      setExpanded((e) => (e.includes(id) ? e : [...e, id]));
      return [...prev, id];
    });
  }
  function toggleSub(id: string) {
    setSelectedSubs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (providerQ.isLoading || catsQ.isLoading || subsQ.isLoading) return <LoadingScreen />;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Services you offer</h1>
        <p className="text-[#6b7b8c] mt-1 text-sm">
          Add or remove trades any time. You'll only receive job alerts for the categories you've selected.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7b8c]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="pl-9 rounded-full"
        />
      </div>

      <div className="mb-4 text-xs text-[#6b7b8c]">
        {selectedCats.length} categor{selectedCats.length === 1 ? "y" : "ies"} · {selectedSubs.length} sub-services selected
      </div>

      <div className="space-y-2">
        {filteredCats.map((c) => {
          const active = selectedCats.includes(c.id);
          const open = expanded.includes(c.id);
          const catSubs = subs.filter((s) => s.category_id === c.id);
          return (
            <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={`h-6 w-6 rounded-md border grid place-items-center shrink-0 ${
                    active ? "bg-[#59914c] border-[#59914c] text-white" : "border-[#E5E7EB] bg-white"
                  }`}
                  aria-label={active ? "Unselect" : "Select"}
                >
                  {active && <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="font-medium text-[#2e4053]">{c.name}</div>
                  {active && (
                    <div className="text-xs text-[#6b7b8c] mt-0.5">
                      {selectedSubs.filter((sid) => catSubs.some((s) => s.id === sid)).length} of {catSubs.length} sub-services
                    </div>
                  )}
                </button>
                {catSubs.length > 0 && (
                  <ChevronDown
                    className={`h-4 w-4 text-[#6b7b8c] transition-transform ${open ? "rotate-180" : ""}`}
                    onClick={() => toggleExpand(c.id)}
                  />
                )}
              </div>
              {open && active && catSubs.length > 0 && (
                <div className="border-t border-[#E5E7EB] p-3 sm:p-4 grid gap-2 sm:grid-cols-2">
                  {catSubs.map((s) => {
                    const sActive = selectedSubs.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSub(s.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left ${
                          sActive
                            ? "bg-[#EEF3EE] border-[#59914c] text-[#2e4053]"
                            : "bg-white border-[#E5E7EB] text-[#2e4053]"
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded border grid place-items-center shrink-0 ${
                            sActive ? "bg-[#59914c] border-[#59914c] text-white" : "border-[#D1D5DB]"
                          }`}
                        >
                          {sActive && <Check className="h-3 w-3" />}
                        </span>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredCats.length === 0 && (
          <div className="text-center text-[#6b7b8c] text-sm py-8">No categories match "{search}"</div>
        )}
      </div>

      <div className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur border-t border-[#E5E7EB] mt-6 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 flex justify-end">
        <Button
          onClick={() => mutation.mutate({ category_ids: selectedCats, subcategory_ids: selectedSubs })}
          disabled={mutation.isPending || selectedCats.length === 0}
          className="rounded-full bg-[#2e4053] hover:bg-[#243342] text-white"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  );
}