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

export const Route = createFileRoute("/_authenticated/post-job")({
  component: PostJobPage,
});

function PostJobPage() {
  const navigate = useNavigate();
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

  if (isLoading) return <LoadingScreen />;

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
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
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
