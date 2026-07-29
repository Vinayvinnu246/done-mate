import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob, getCategories } from "@/lib/jobs.functions";
import { supabase } from "@/integrations/supabase/client";
import { X, Upload } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/post-job")({
  component: PostJobPage,
});

function PostJobPage() {
  const navigate = useNavigate();
  const { profile, isLoading: authLoading, signOut } = useAuth();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [urgency, setUrgency] = useState<"standard" | "today" | "emergency">("standard");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [images, setImages] = useState<{ path: string; previewUrl: string }[]>([]);
  const [videos, setVideos] = useState<{ path: string; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (job) => {
      toast.success("Job posted successfully");
      navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post job");
    },
  });

  if (authLoading) return <LoadingScreen />;

  if (profile && profile.type === "provider") {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <Briefcase className="h-6 w-6 text-emerald-700" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#2e4053]">
            You're signed in as a provider
          </h1>
          <p className="text-[#6b7b8c] mt-2">
            Switch to a customer account to request a quote or post a job.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              className="rounded-full"
              onClick={async () => {
                await signOut();
                navigate({
                  to: "/auth",
                  search: { mode: "login", role: "customer", next: "/post-job" },
                });
              }}
            >
              Switch account
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingScreen />;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 8) {
      toast.error("You can upload up to 8 images");
      return;
    }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");
      const uploaded: { path: string; previewUrl: string }[] = [];
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 8MB`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("job-images").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        const { data: signed } = await supabase.storage
          .from("job-images")
          .createSignedUrl(path, 60 * 60);
        uploaded.push({ path, previewUrl: signed?.signedUrl ?? "" });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeImage(path: string) {
    await supabase.storage.from("job-images").remove([path]);
    setImages((prev) => prev.filter((img) => img.path !== path));
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (videos.length + files.length > 4) {
      toast.error("You can upload up to 4 videos");
      return;
    }
    setUploadingVideo(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");
      const uploaded: { path: string; previewUrl: string }[] = [];
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 50MB`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "mp4";
        const path = `${userId}/videos/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("job-images").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        const { data: signed } = await supabase.storage
          .from("job-images")
          .createSignedUrl(path, 60 * 60);
        uploaded.push({ path, previewUrl: signed?.signedUrl ?? "" });
      }
      setVideos((prev) => [...prev, ...uploaded]);
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  async function removeVideo(path: string) {
    await supabase.storage.from("job-images").remove([path]);
    setVideos((prev) => prev.filter((v) => v.path !== path));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim() || title.length < 5) next.title = "Title must be at least 5 characters";
    if (!description.trim() || description.length < 20) next.description = "Description must be at least 20 characters";
    if (!categoryId) next.categoryId = "Select a category";
    if (!addressLine1.trim()) next.addressLine1 = "Address line 1 is required";
    if (!city.trim()) next.city = "City is required";
    if (!postcode.trim()) next.postcode = "Postcode is required";
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (budgetMax && budgetMin && max < min) next.budgetMax = "Max budget must be at least min budget";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      data: {
        title,
        description,
        category_id: categoryId,
        urgency,
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: budgetMax ? Number(budgetMax) : undefined,
        scheduled_date: scheduledDate || undefined,
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        city,
        postcode,
        images: images.length ? images.map((img) => img.path) : undefined,
        videos: videos.length ? videos.map((v) => v.path) : undefined,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <BackButton className="mb-4" />
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-[#2e4053]">Post a job</h1>
          <p className="text-[#6b7b8c] mt-1">
            Describe what you need and get competitive quotes from verified professionals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E7EB] space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job title</Label>
            <Input
              id="title"
              placeholder="e.g. Fix a leaking kitchen tap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the problem, size of the area, materials needed, access details, etc."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Min budget (£)</Label>
              <Input
                id="budgetMin"
                type="number"
                min={0}
                placeholder="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Max budget (£)</Label>
              <Input
                id="budgetMax"
                type="number"
                min={0}
                placeholder="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className={errors.budgetMax ? "border-red-500" : ""}
              />
              {errors.budgetMax && <p className="text-xs text-red-500">{errors.budgetMax}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Preferred date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Photos (optional)</Label>
            <p className="text-xs text-[#6b7b8c]">
              Add up to 8 photos to help providers understand the job. Max 8MB each.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.path} className="relative aspect-square rounded-lg overflow-hidden border border-[#E5E7EB] bg-[#F5F5F0]">
                  {img.previewUrl && (
                    <img src={img.previewUrl} alt="Job upload" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.path)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-[#E5E7EB] hover:border-[#2e4053] flex flex-col items-center justify-center cursor-pointer text-[#6b7b8c] hover:text-[#2e4053] transition-colors">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-xs">{uploading ? "Uploading…" : "Add photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Videos (optional)</Label>
            <p className="text-xs text-[#6b7b8c]">
              Add up to 4 short videos. Max 50MB each.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map((v) => (
                <div key={v.path} className="relative aspect-video rounded-lg overflow-hidden border border-[#E5E7EB] bg-black">
                  {v.previewUrl && (
                    <video src={v.previewUrl} controls className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeVideo(v.path)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                    aria-label="Remove video"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {videos.length < 4 && (
                <label className="aspect-video rounded-lg border-2 border-dashed border-[#E5E7EB] hover:border-[#2e4053] flex flex-col items-center justify-center cursor-pointer text-[#6b7b8c] hover:text-[#2e4053] transition-colors">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-xs">{uploadingVideo ? "Uploading…" : "Add video"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={uploadingVideo}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#2e4053]">Location</h3>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className={errors.addressLine1 ? "border-red-500" : ""}
              />
              {errors.addressLine1 && <p className="text-xs text-red-500">{errors.addressLine1}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
              <Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className={errors.postcode ? "border-red-500" : ""}
                />
                {errors.postcode && <p className="text-xs text-red-500">{errors.postcode}</p>}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full rounded-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Posting…" : "Post job & get quotes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
