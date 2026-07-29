import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/report-problem")({
  head: () => ({
    meta: [
      { title: "Report a problem — DoneToday" },
      { name: "description", content: "Report provider or customer misconduct, fraud, spam, technical issues, payment problems or safety concerns to DoneToday." },
      { property: "og:title", content: "Report a problem" },
      { property: "og:description", content: "Tell the DoneToday safety team what happened." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReportPage,
});

const categories = [
  "Provider misconduct",
  "Customer misconduct",
  "Fraud",
  "Spam",
  "Technical issue",
  "Payment issue",
  "Safety concern",
];

function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", category: categories[0], reference: "", details: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[Report] ${form.category}${form.reference ? ` — ref ${form.reference}` : ""}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCategory: ${form.category}\nReference: ${form.reference}\n\n${form.details}`,
    );
    window.location.href = `mailto:${COMPANY.supportEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const input = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

  return (
    <LegalPage
      eyebrow="Support"
      title="Report a problem"
      intro="Tell us what happened. Our safety team reviews every report and typically responds within one working day."
    >
      <Section heading="What are you reporting?">
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <Field label="Your name">
            <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          </Field>
          <Field label="Email">
            <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Job or account reference (optional)">
            <input maxLength={100} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className={input} />
          </Field>
          <Field label="What happened?">
            <textarea required maxLength={2000} rows={6} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={input} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              By submitting you agree we may contact you about this report. Do not include payment card details.
            </p>
            <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Send report
            </button>
          </div>
          {submitted && (
            <p className="text-sm text-primary">Your email client should open with the report ready to send. If not, email {COMPANY.supportEmail} directly.</p>
          )}
        </form>
      </Section>
      <Section heading="In an emergency">
        <p>If someone is in immediate danger, call <strong>999</strong>. This form is for non-urgent reports only.</p>
      </Section>
    </LegalPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}