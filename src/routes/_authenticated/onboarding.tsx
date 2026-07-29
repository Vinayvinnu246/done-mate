import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Header } from "@/components/layout/Header";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getCategories } from "@/lib/jobs.functions";
import {
  getMyProviderProfile,
  submitProviderOnboarding,
  listSubcategories,
} from "@/lib/onboarding.functions";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  User,
  Briefcase,
  Wrench,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const steps = [
  { key: "personal", title: "Personal details", icon: User },
  { key: "business", title: "Business details", icon: Briefcase },
  { key: "services", title: "Services", icon: Wrench },
  { key: "area", title: "Service area", icon: MapPin },
  { key: "availability", title: "Availability", icon: Clock },
  { key: "verification", title: "Verification", icon: ShieldCheck },
] as const;

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DOC_TYPES = [
  { key: "id", label: "Proof of identity", required: true },
  { key: "address_proof", label: "Proof of address", required: true },
  { key: "insurance", label: "Public liability insurance", required: false },
  { key: "trade_licence", label: "Trade qualifications", required: false },
  { key: "dbs", label: "DBS certificate", required: false },
  { key: "company_docs", label: "Company documents", required: false },
] as const;

type DocKey = (typeof DOC_TYPES)[number]["key"];

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const isProvider = profile?.type === "provider";

  const providerQuery = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => getMyProviderProfile(),
    enabled: isProvider,
  });
  const catsQuery = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const subsQuery = useQuery({ queryKey: ["subcategories"], queryFn: () => listSubcategories() });

  const [step, setStep] = useState<Step>(0);

  // form state
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dob, setDob] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [businessType, setBusinessType] = useState<"sole_trader" | "limited">("sole_trader");
  const [companyNumber, setCompanyNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  const [postcode, setPostcode] = useState("");
  const [serviceRadius, setServiceRadius] = useState("10");
  const [areasCoveredInput, setAreasCoveredInput] = useState("");

  const [workingDays, setWorkingDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [availableToday, setAvailableToday] = useState(true);
  const [emergencyJobs, setEmergencyJobs] = useState(false);
  const [holidayInput, setHolidayInput] = useState("");
  const [holidayDates, setHolidayDates] = useState<string[]>([]);

  const [documents, setDocuments] = useState<Record<string, { url: string; expiry?: string; uploading?: boolean }>>({});

  const mutation = useMutation({
    mutationFn: submitProviderOnboarding,
    onSuccess: () => {
      toast.success("Onboarding submitted — verification is under review");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to submit"),
  });

  const subsForSelected = useMemo(
    () => (subsQuery.data ?? []).filter((s) => selectedCategories.includes(s.category_id)),
    [subsQuery.data, selectedCategories],
  );

  if (providerQuery.isLoading || !isProvider) return <LoadingScreen />;

  const alreadySubmitted =
    providerQuery.data?.verification_status && providerQuery.data.verification_status !== "unverified";

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-8 border border-[#E5E7EB] mt-12">
          <ShieldCheck className="h-10 w-10 text-[#59914c] mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-[#2e4053]">Onboarding complete</h1>
          <p className="text-[#6b7b8c] mt-2">
            Your verification status is <span className="font-medium capitalize">{providerQuery.data?.verification_status}</span>.
          </p>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <Button className="rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
              Go to dashboard
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/verification">Manage documents</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async function uploadFile(bucket: string, path: string, file: File) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    setAvatarUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}-${file.name}`;
      await uploadFile("job-images", path, file);
      const { data } = await supabase.storage.from("job-images").createSignedUrl(path, 60 * 60 * 24 * 365);
      setAvatarUrl(data?.signedUrl ?? "");
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleDocUpload(docKey: DocKey, file: File) {
    if (!user) return;
    setDocuments((prev) => ({ ...prev, [docKey]: { ...(prev[docKey] ?? { url: "" }), uploading: true } }));
    try {
      const path = `${user.id}/${docKey}-${Date.now()}-${file.name}`;
      await uploadFile("verifications", path, file);
      setDocuments((prev) => ({ ...prev, [docKey]: { url: path, uploading: false } }));
      toast.success("Document uploaded");
    } catch (e) {
      setDocuments((prev) => ({ ...prev, [docKey]: { ...(prev[docKey] ?? { url: "" }), uploading: false } }));
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function next() {
    // per-step validation
    if (step === 0) {
      if (!displayName || !phone) return toast.error("Full name and phone are required");
    }
    if (step === 2) {
      if (selectedCategories.length === 0) return toast.error("Pick at least one service category");
    }
    if (step === 3) {
      if (!postcode) return toast.error("Enter your base postcode");
    }
    if (step === 5) return handleSubmit();
    setStep((s) => (Math.min(5, s + 1) as Step));
  }

  function back() {
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  function handleSubmit() {
    const docs = Object.entries(documents)
      .filter(([, v]) => v.url)
      .map(([document_type, v]) => ({ document_type: document_type as DocKey, url: v.url, expiry_date: v.expiry }));

    const hasId = docs.some((d) => d.document_type === "id");
    const hasAddr = docs.some((d) => d.document_type === "address_proof");
    if (!hasId || !hasAddr) return toast.error("Please upload proof of identity and proof of address");

    mutation.mutate({
      data: {
        display_name: displayName || undefined,
        phone: phone || undefined,
        avatar_url: avatarUrl || undefined,
        date_of_birth: dob || undefined,
        home_address: homeAddress || undefined,
        business_name: businessName || undefined,
        trading_name: tradingName || undefined,
        business_type: businessType,
        company_number: businessType === "limited" ? companyNumber || undefined : undefined,
        vat_registered: vatRegistered,
        vat_number: vatRegistered ? vatNumber || undefined : undefined,
        bio: bio || undefined,
        years_experience: yearsExperience ? Number(yearsExperience) : undefined,
        category_ids: selectedCategories,
        subcategory_ids: selectedSubs,
        postcode: postcode || undefined,
        service_radius: Number(serviceRadius) || 10,
        areas_covered: areasCoveredInput ? areasCoveredInput.split(",").map((a) => a.trim()).filter(Boolean) : [],
        working_days: workingDays as ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[],
        working_hours: { start: workStart, end: workEnd },
        available_today: availableToday,
        emergency_jobs: emergencyJobs,
        holiday_dates: holidayDates,
        documents: docs,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-[#2e4053]">Provider onboarding</h1>
          <p className="text-[#6b7b8c] mt-1">Complete these steps to start receiving matched jobs.</p>
        </div>

        {/* Progress */}
        <ol className="mb-8 grid grid-cols-6 gap-2">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex flex-col items-center text-center">
                <div
                  className={`h-9 w-9 rounded-full grid place-items-center text-sm font-medium border ${
                    done
                      ? "bg-[#59914c] text-white border-[#59914c]"
                      : active
                      ? "bg-[#2e4053] text-white border-[#2e4053]"
                      : "bg-white text-[#6b7b8c] border-[#E5E7EB]"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`mt-1 text-[10px] sm:text-xs ${active ? "text-[#2e4053] font-medium" : "text-[#6b7b8c]"}`}>
                  {s.title}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-8 space-y-6">
          {/* STEP 0 — Personal */}
          {step === 0 && (
            <>
              <StepHeader title="Personal details" description="This information stays private and is only used for verification." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </Field>
                <Field label="Phone number">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7…" />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </Field>
                <Field label="Profile photo">
                  <div className="flex items-center gap-3">
                    {avatarUrl && (
                      <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-[#E5E7EB]" />
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm hover:bg-[#F3F4F6]">
                      {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                      />
                    </label>
                  </div>
                </Field>
                <Field label="Home address" full>
                  <Textarea rows={2} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* STEP 1 — Business */}
          {step === 1 && (
            <>
              <StepHeader title="Business details" description="Tell customers about your business." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name">
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </Field>
                <Field label="Trading name (optional)">
                  <Input value={tradingName} onChange={(e) => setTradingName(e.target.value)} />
                </Field>
                <Field label="Business type">
                  <div className="flex gap-2">
                    {(["sole_trader", "limited"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBusinessType(t)}
                        className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                          businessType === t
                            ? "bg-[#2e4053] text-white border-[#2e4053]"
                            : "bg-white text-[#2e4053] border-[#E5E7EB]"
                        }`}
                      >
                        {t === "sole_trader" ? "Sole trader" : "Limited company"}
                      </button>
                    ))}
                  </div>
                </Field>
                {businessType === "limited" && (
                  <Field label="Company number">
                    <Input value={companyNumber} onChange={(e) => setCompanyNumber(e.target.value)} />
                  </Field>
                )}
                <Field label="Years of experience">
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                  />
                </Field>
                <Field label="VAT registered">
                  <div className="flex items-center gap-3 h-10">
                    <Switch checked={vatRegistered} onCheckedChange={setVatRegistered} />
                    <span className="text-sm text-[#6b7b8c]">{vatRegistered ? "Yes" : "No"}</span>
                  </div>
                </Field>
                {vatRegistered && (
                  <Field label="VAT number">
                    <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                  </Field>
                )}
                <Field label="Business biography" full>
                  <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers what you do…" />
                </Field>
              </div>
            </>
          )}

          {/* STEP 2 — Services */}
          {step === 2 && (
            <>
              <StepHeader title="Services you offer" description="Pick categories, then choose the specific sub-services." />
              <div>
                <Label className="mb-2 block">Categories</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {catsQuery.data?.map((c) => {
                    const active = selectedCategories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setSelectedCategories((prev) => {
                            const next = toggle(prev, c.id);
                            if (!next.includes(c.id)) {
                              // drop related subs
                              setSelectedSubs((subs) =>
                                subs.filter(
                                  (sid) => (subsQuery.data ?? []).find((s) => s.id === sid)?.category_id !== c.id,
                                ),
                              );
                            }
                            return next;
                          })
                        }
                        className={`rounded-xl px-3 py-2 text-sm border text-left ${
                          active
                            ? "bg-[#2e4053] text-white border-[#2e4053]"
                            : "bg-white text-[#2e4053] border-[#E5E7EB]"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedCategories.length > 0 && (
                <div>
                  <Label className="mb-2 block">Sub-services</Label>
                  <div className="space-y-4">
                    {selectedCategories.map((catId) => {
                      const cat = catsQuery.data?.find((c) => c.id === catId);
                      const subs = subsForSelected.filter((s) => s.category_id === catId);
                      return (
                        <div key={catId} className="rounded-xl border border-[#E5E7EB] p-3">
                          <p className="text-xs font-semibold uppercase text-[#6b7b8c] mb-2">{cat?.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {subs.map((s) => {
                              const active = selectedSubs.includes(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSelectedSubs((prev) => toggle(prev, s.id))}
                                  className={`rounded-full px-3 py-1.5 text-xs border ${
                                    active
                                      ? "bg-[#59914c] text-white border-[#59914c]"
                                      : "bg-white text-[#2e4053] border-[#E5E7EB]"
                                  }`}
                                >
                                  {s.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3 — Service area */}
          {step === 3 && (
            <>
              <StepHeader title="Service area" description="Where do you work? Only matching jobs will be shown." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Base postcode">
                  <Input value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} placeholder="e.g. SW1A 1AA" />
                </Field>
                <Field label="Service radius (miles)">
                  <Input type="number" min={1} max={100} value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)} />
                </Field>
                <Field label="Areas covered (comma separated)" full>
                  <Input
                    value={areasCoveredInput}
                    onChange={(e) => setAreasCoveredInput(e.target.value)}
                    placeholder="e.g. Camden, Islington, Hackney"
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAF8] p-5 text-center text-sm text-[#6b7b8c]">
                Interactive map preview is enabled in Phase 2 once maps are configured.
              </div>
            </>
          )}

          {/* STEP 4 — Availability */}
          {step === 4 && (
            <>
              <StepHeader title="Availability" description="Set your default working schedule." />
              <div>
                <Label className="mb-2 block">Working days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => {
                    const active = workingDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setWorkingDays((prev) => toggle(prev, d))}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          active
                            ? "bg-[#2e4053] text-white border-[#2e4053]"
                            : "bg-white text-[#2e4053] border-[#E5E7EB]"
                        }`}
                      >
                        {d.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start">
                  <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
                </Field>
                <Field label="End">
                  <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ToggleRow label="Available today" checked={availableToday} onChange={setAvailableToday} />
                <ToggleRow
                  label="Accept emergency jobs"
                  description="Same-day and out-of-hours requests"
                  checked={emergencyJobs}
                  onChange={setEmergencyJobs}
                />
              </div>
              <div>
                <Label className="mb-2 block">Holiday / unavailable dates</Label>
                <div className="flex gap-2">
                  <Input type="date" value={holidayInput} onChange={(e) => setHolidayInput(e.target.value)} />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      if (!holidayInput) return;
                      setHolidayDates((prev) => Array.from(new Set([...prev, holidayInput])));
                      setHolidayInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                {holidayDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {holidayDates.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1 text-xs text-[#2e4053]">
                        {d}
                        <button type="button" onClick={() => setHolidayDates((prev) => prev.filter((x) => x !== d))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 5 — Verification */}
          {step === 5 && (
            <>
              <StepHeader
                title="Verification"
                description="Upload documents so we can verify your identity. Files are stored securely and only reviewed by our verification team."
              />
              <div className="space-y-3">
                {DOC_TYPES.map((d) => {
                  const doc = documents[d.key];
                  return (
                    <div key={d.key} className="rounded-xl border border-[#E5E7EB] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#2e4053]">
                            {d.label} {d.required && <span className="text-[#c0392b]">*</span>}
                          </p>
                          <p className="text-xs text-[#6b7b8c]">PDF, JPG or PNG · up to 10MB</p>
                        </div>
                        {doc?.url && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#59914c]">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm hover:bg-[#F3F4F6]">
                          {doc?.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {doc?.url ? "Replace file" : "Upload file"}
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (f.size > 10 * 1024 * 1024) {
                                toast.error("File too large (max 10MB)");
                                return;
                              }
                              handleDocUpload(d.key, f);
                            }}
                          />
                        </label>
                        <Input
                          type="date"
                          className="max-w-40"
                          placeholder="Expiry"
                          value={doc?.expiry ?? ""}
                          onChange={(e) =>
                            setDocuments((prev) => ({
                              ...prev,
                              [d.key]: { ...(prev[d.key] ?? { url: "" }), expiry: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
            <Button variant="ghost" onClick={back} disabled={step === 0} className="rounded-full">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="text-xs text-[#6b7b8c]">Step {step + 1} of {steps.length}</div>
            <Button onClick={next} disabled={mutation.isPending} className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]">
              {step === 5 ? (mutation.isPending ? "Submitting…" : "Submit for review") : (<>Next <ChevronRight className="h-4 w-4 ml-1" /></>)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-[#2e4053]">{title}</h2>
      <p className="text-sm text-[#6b7b8c] mt-1">{description}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3">
      <div>
        <p className="text-sm font-medium text-[#2e4053]">{label}</p>
        {description && <p className="text-xs text-[#6b7b8c] mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}