import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Upload, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategories } from "@/lib/jobs.functions";
import {
  getMyProviderServices,
  upsertProviderService,
  deleteProviderService,
  toggleServicePause,
  saveQualification,
  deleteQualification,
  addServiceArea,
  deleteServiceArea,
  addPortfolioItem,
  deletePortfolioItem,
  requestNewCategory,
} from "@/lib/provider-services.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

async function uploadToBucket(bucket: string, userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function ProviderServiceManagement() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const dataQ = useQuery({ queryKey: ["my-provider-services"], queryFn: () => getMyProviderServices() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-provider-services"] });

  if (catsQ.isLoading || dataQ.isLoading) {
    return <div className="py-12 text-center text-[#6b7b8c]"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  }

  const cats = catsQ.data ?? [];
  const services = dataQ.data?.services ?? [];
  const qualifications = dataQ.data?.qualifications ?? [];
  const areas = dataQ.data?.areas ?? [];
  const portfolio = dataQ.data?.portfolio ?? [];
  const requests = dataQ.data?.requests ?? [];

  return (
    <div className="space-y-10">
      <ServicesSection cats={cats} services={services} onChange={invalidate} />
      <QualificationsSection cats={cats} items={qualifications} userId={userId ?? ""} onChange={invalidate} />
      <AreasSection cats={cats} items={areas} onChange={invalidate} />
      <PortfolioSection cats={cats} items={portfolio} userId={userId ?? ""} onChange={invalidate} />
      <RequestCategorySection items={requests} onChange={invalidate} />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-[#2e4053]">{title}</h2>
        {description && <p className="text-sm text-[#6b7b8c] mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

type Cat = { id: string; name: string; icon: string | null; requires_qualification?: boolean | null };

function ServicesSection({ cats, services, onChange }: { cats: Cat[]; services: any[]; onChange: () => void }) {
  const [pickCat, setPickCat] = useState("");
  const upsert = useMutation({ mutationFn: upsertProviderService, onSuccess: () => { toast.success("Saved"); onChange(); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: deleteProviderService, onSuccess: () => { toast.success("Removed"); onChange(); }, onError: (e: Error) => toast.error(e.message) });
  const pause = useMutation({ mutationFn: toggleServicePause, onSuccess: () => { onChange(); }, onError: (e: Error) => toast.error(e.message) });

  const availableCats = cats.filter((c) => !services.some((s) => s.category_id === c.id));

  return (
    <Section title="Services & pricing" description="Set your rates, experience and availability for each trade.">
      <div className="flex gap-2 mb-4">
        <select value={pickCat} onChange={(e) => setPickCat(e.target.value)} className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm bg-white">
          <option value="">Add another service…</option>
          {availableCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <Button
          type="button"
          disabled={!pickCat || upsert.isPending}
          onClick={() => { upsert.mutate({ data: { category_id: pickCat } } as any); setPickCat(""); }}
          className="rounded-full bg-[#2e4053] hover:bg-[#243342] text-white"
        ><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="space-y-3">
        {services.map((s) => {
          const cat = cats.find((c) => c.id === s.category_id);
          return (
            <ServiceCard
              key={s.id}
              service={s}
              cat={cat}
              onSave={(patch: Record<string, unknown>) => upsert.mutate({ data: { category_id: s.category_id, ...patch } } as any)}
              onDelete={() => del.mutate({ data: { category_id: s.category_id } } as any)}
              onTogglePause={() => pause.mutate({ data: { category_id: s.category_id, is_active: !s.is_active } } as any)}
              busy={upsert.isPending || del.isPending}
            />
          );
        })}
        {services.length === 0 && <p className="text-sm text-[#6b7b8c]">No services yet — add one above.</p>}
      </div>
    </Section>
  );
}

function ServiceCard({ service, cat, onSave, onDelete, onTogglePause, busy }: any) {
  const [form, setForm] = useState({
    years_experience: service.years_experience ?? "",
    experience_description: service.experience_description ?? "",
    callout_fee: service.callout_fee ?? "",
    hourly_rate: service.hourly_rate ?? "",
    minimum_job_price: service.minimum_job_price ?? "",
    emergency_available: !!service.emergency_available,
    inspection_available: !!service.inspection_available,
  });
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-[#2e4053] flex items-center gap-2">
          <span>{cat?.icon}</span> {cat?.name ?? "Service"}
          {!service.is_active && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Paused</span>}
          {cat?.requires_qualification && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Qualification required</span>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onTogglePause} className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] flex items-center gap-1">
            {service.is_active ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
          </button>
          <button type="button" onClick={onDelete} className="text-xs px-3 py-1 rounded-full border border-red-200 text-red-600 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <NumberField label="Years experience" value={form.years_experience} onChange={(v) => setForm({ ...form, years_experience: v })} />
        <NumberField label="Callout fee (£)" value={form.callout_fee} onChange={(v) => setForm({ ...form, callout_fee: v })} />
        <NumberField label="Hourly rate (£)" value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} />
        <NumberField label="Min job price (£)" value={form.minimum_job_price} onChange={(v) => setForm({ ...form, minimum_job_price: v })} />
        <label className="flex items-center gap-2 text-sm text-[#2e4053] mt-6">
          <input type="checkbox" checked={form.emergency_available} onChange={(e) => setForm({ ...form, emergency_available: e.target.checked })} /> Emergency jobs
        </label>
        <label className="flex items-center gap-2 text-sm text-[#2e4053] mt-6">
          <input type="checkbox" checked={form.inspection_available} onChange={(e) => setForm({ ...form, inspection_available: e.target.checked })} /> Free site inspections
        </label>
      </div>
      <div className="mt-3">
        <Label className="text-xs">Experience notes</Label>
        <textarea
          value={form.experience_description}
          onChange={(e) => setForm({ ...form, experience_description: e.target.value })}
          rows={2}
          className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          placeholder="Briefly describe your experience in this trade"
        />
      </div>
      <div className="flex justify-end mt-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() => onSave({
            years_experience: form.years_experience === "" ? null : Number(form.years_experience),
            experience_description: form.experience_description || null,
            callout_fee: form.callout_fee === "" ? null : Number(form.callout_fee),
            hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
            minimum_job_price: form.minimum_job_price === "" ? null : Number(form.minimum_job_price),
            emergency_available: form.emergency_available,
            inspection_available: form.inspection_available,
          })}
          className="rounded-full bg-[#59914c] hover:bg-[#4a7a3f] text-white"
        >Save</Button>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}

function QualificationsSection({ cats, items, userId, onChange }: { cats: Cat[]; items: any[]; userId: string; onChange: () => void }) {
  const [form, setForm] = useState({ qualification_name: "", registration_number: "", issuing_body: "", category_id: "", issue_date: "", expiry_date: "", document_url: "" });
  const [uploading, setUploading] = useState(false);
  const save = useMutation({ mutationFn: saveQualification, onSuccess: () => { toast.success("Submitted for review"); onChange(); setForm({ qualification_name: "", registration_number: "", issuing_body: "", category_id: "", issue_date: "", expiry_date: "", document_url: "" }); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: deleteQualification, onSuccess: () => onChange(), onError: (e: Error) => toast.error(e.message) });

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !userId) return;
    setUploading(true);
    try {
      const url = await uploadToBucket("verifications", userId, f);
      setForm((s) => ({ ...s, document_url: url }));
      toast.success("Document uploaded");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <Section title="Qualifications & certificates" description="Upload proof (Gas Safe, NICEIC, DBS, insurance, trade licences). Admin will review and issue a verified badge.">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">Qualification name</Label><Input value={form.qualification_name} onChange={(e) => setForm({ ...form, qualification_name: e.target.value })} placeholder="e.g. Gas Safe Registered" /></div>
          <div><Label className="text-xs">Issuing body</Label><Input value={form.issuing_body} onChange={(e) => setForm({ ...form, issuing_body: e.target.value })} placeholder="e.g. Gas Safe Register" /></div>
          <div><Label className="text-xs">Registration / cert number</Label><Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} /></div>
          <div><Label className="text-xs">Trade</Label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm bg-white mt-1">
              <option value="">General</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Issue date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
          <div><Label className="text-xs">Expiry date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
        </div>
        <div>
          <Label className="text-xs">Document (PDF or image)</Label>
          <div className="mt-1 flex items-center gap-2">
            <input type="file" accept="image/*,application/pdf" onChange={pickFile} className="text-sm" />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.document_url && !uploading && <span className="text-xs text-emerald-600">Uploaded</span>}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={save.isPending || !form.qualification_name || !form.document_url}
            onClick={() => save.mutate({ data: {
              qualification_name: form.qualification_name,
              issuing_body: form.issuing_body || null,
              registration_number: form.registration_number || null,
              category_id: form.category_id || null,
              issue_date: form.issue_date || null,
              expiry_date: form.expiry_date || null,
              document_url: form.document_url,
            } } as any)}
            className="rounded-full bg-[#2e4053] hover:bg-[#243342] text-white"
          >Submit for verification</Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((q) => (
          <div key={q.id} className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-[#2e4053] text-sm">{q.qualification_name}</div>
              <div className="text-xs text-[#6b7b8c]">{q.issuing_body ?? ""} {q.registration_number ? `· ${q.registration_number}` : ""}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${q.verification_status === "approved" ? "bg-emerald-100 text-emerald-700" : q.verification_status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{q.verification_status}</span>
              <button onClick={() => del.mutate({ data: { id: q.id } } as any)} className="text-xs text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function AreasSection({ cats, items, onChange }: { cats: Cat[]; items: any[]; onChange: () => void }) {
  const [form, setForm] = useState({ postcode: "", radius_miles: 10, category_id: "" });
  const add = useMutation({ mutationFn: addServiceArea, onSuccess: () => { toast.success("Added"); onChange(); setForm({ postcode: "", radius_miles: 10, category_id: "" }); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: deleteServiceArea, onSuccess: onChange });
  return (
    <Section title="Service areas" description="Postcode-based coverage — add areas per trade or leave 'All trades' for global.">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 grid sm:grid-cols-4 gap-3">
        <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })} placeholder="SW1" /></div>
        <div><Label className="text-xs">Radius (miles)</Label><Input type="number" min="1" max="100" value={form.radius_miles} onChange={(e) => setForm({ ...form, radius_miles: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Applies to</Label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm bg-white mt-1">
            <option value="">All trades</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" disabled={!form.postcode || add.isPending} onClick={() => add.mutate({ data: { ...form, category_id: form.category_id || null } } as any)} className="w-full rounded-full bg-[#2e4053] hover:bg-[#243342] text-white">Add area</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full pl-3 pr-1 py-1 text-sm">
            <span>{a.postcode} · {a.radius_miles}mi{a.category_id ? ` · ${cats.find((c) => c.id === a.category_id)?.name ?? "trade"}` : ""}</span>
            <button onClick={() => del.mutate({ data: { id: a.id } } as any)} className="p-1 text-red-600"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PortfolioSection({ cats, items, userId, onChange }: { cats: Cat[]; items: any[]; userId: string; onChange: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category_id: "" });
  const add = useMutation({ mutationFn: addPortfolioItem, onSuccess: () => { toast.success("Added"); onChange(); }, onError: (e: Error) => toast.error(e.message) });
  const del = useMutation({ mutationFn: deletePortfolioItem, onSuccess: onChange });

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !userId) return;
    setUploading(true);
    try {
      const image_url = await uploadToBucket("job-images", userId, f);
      add.mutate({ data: { image_url, title: form.title || null, description: form.description || null, category_id: form.category_id || null } } as any);
      setForm({ title: "", description: "", category_id: "" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <Section title="Portfolio" description="Show off completed work. Customers will see these on your profile.">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
            <option value="">Any trade</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#2e4053] border border-dashed border-[#E5E7EB] rounded-lg px-4 py-3">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={uploading} />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((p) => (
          <div key={p.id} className="relative group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <img src={p.image_url} alt={p.title ?? "portfolio"} className="w-full h-32 object-cover" loading="lazy" />
            {p.title && <div className="p-2 text-xs text-[#2e4053] truncate">{p.title}</div>}
            <button onClick={() => del.mutate({ data: { id: p.id } } as any)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-600"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RequestCategorySection({ items, onChange }: { items: any[]; onChange: () => void }) {
  const [form, setForm] = useState({ proposed_name: "", description: "" });
  const req = useMutation({ mutationFn: requestNewCategory, onSuccess: () => { toast.success("Requested — admin will review"); onChange(); setForm({ proposed_name: "", description: "" }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <Section title="Suggest a new service" description="Can't find your trade? Request it and our team will review.">
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 grid sm:grid-cols-3 gap-3">
        <Input placeholder="Service name" value={form.proposed_name} onChange={(e) => setForm({ ...form, proposed_name: e.target.value })} />
        <Input placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-1" />
        <Button type="button" disabled={!form.proposed_name || req.isPending} onClick={() => req.mutate({ data: form } as any)} className="rounded-full bg-[#2e4053] hover:bg-[#243342] text-white">Submit request</Button>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((r) => (
          <div key={r.id} className="text-sm text-[#2e4053] bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 flex items-center justify-between">
            <span>{r.proposed_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}