import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getCategories } from "@/lib/jobs.functions";
import { getMyProviderProfile, submitProviderOnboarding } from "@/lib/onboarding.functions";
import { Shield, Upload, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const documentTypes = [
  { key: "id", label: "Government ID" },
  { key: "selfie", label: "Selfie photo" },
  { key: "insurance", label: "Insurance certificate" },
  { key: "dbs", label: "DBS check" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: providerProfile, isLoading } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => getMyProviderProfile(),
    enabled: profile?.type === "provider",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [serviceRadius, setServiceRadius] = useState("10");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: submitProviderOnboarding,
    onSuccess: () => {
      toast.success("Onboarding submitted for review");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit onboarding");
    },
  });

  if (isLoading || profile?.type !== "provider") {
    return <LoadingScreen />;
  }

  if (providerProfile?.verification_status && providerProfile.verification_status !== "unverified") {
    return (
      <div className="min-h-screen bg-[#FAFAF8] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-8 border border-[#E5E7EB]">
          <Shield className="h-10 w-10 text-[#59914c] mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-[#2e4053]">Verification in progress</h1>
          <p className="text-[#6b7b8c] mt-2">
            Your documents are under review. We will notify you once your profile is verified.
          </p>
          <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const docs = Object.entries(documents)
      .filter(([, url]) => url.trim())
      .map(([document_type, url]) => ({ document_type, url }));

    if (docs.length < 2) {
      toast.error("Please provide at least an ID and a selfie");
      return;
    }

    mutation.mutate({
      data: {
        bio: bio || undefined,
        years_experience: yearsExperience ? Number(yearsExperience) : undefined,
        service_radius: Number(serviceRadius) || 10,
        category_ids: selectedCategories,
        documents: docs,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-[#2e4053]">Provider onboarding</h1>
          <p className="text-[#6b7b8c] mt-1">
            Complete your profile and upload verification documents to start quoting on jobs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E7EB] space-y-8">
          <div className="space-y-4">
            <h2 className="font-semibold text-[#2e4053] flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </h2>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your experience and the services you offer."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  max={60}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRadius">Service radius (miles)</Label>
                <Input
                  id="serviceRadius"
                  type="number"
                  min={1}
                  max={100}
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-[#2e4053]">Service categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Label htmlFor={category.id} className="font-normal cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-[#2e4053] flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Verification documents
            </h2>
            <p className="text-sm text-[#6b7b8c]">
              Upload or paste a secure URL for each document. Accepted formats: PDF, JPG, PNG.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {documentTypes.map((doc) => (
                <div key={doc.key} className="space-y-2">
                  <Label htmlFor={doc.key}>{doc.label}</Label>
                  <Input
                    id={doc.key}
                    placeholder={`https://.../${doc.key}.pdf`}
                    value={documents[doc.key] ?? ""}
                    onChange={(e) =>
                      setDocuments((prev) => ({ ...prev, [doc.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full rounded-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit for verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
