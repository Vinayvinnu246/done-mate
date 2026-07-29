import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Wrench,
  CreditCard,
  CalendarCheck,
  FileText,
  ShieldCheck,
  LifeBuoy,
  AlertTriangle,
  UserCog,
  Gavel,
  Search,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LegalPage, Section } from "@/components/layout/LegalPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre — DoneToday" },
      { name: "description", content: "Search articles and browse guides for customers, pros, payments, bookings, quotes, verification, safety, disputes and account management." },
      { property: "og:title", content: "DoneToday Help Centre" },
      { property: "og:description", content: "Searchable help articles across every part of DoneToday." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

type CategoryId =
  | "customers"
  | "providers"
  | "payments"
  | "bookings"
  | "quotes"
  | "verification"
  | "technical"
  | "safety"
  | "account"
  | "disputes";

type Article = { q: string; a: string; category: CategoryId };

const categories: { id: CategoryId; label: string; icon: LucideIcon; blurb: string }[] = [
  { id: "customers", label: "Customers", icon: Users, blurb: "Posting jobs, comparing quotes and booking pros." },
  { id: "providers", label: "Providers", icon: Wrench, blurb: "Winning work, managing services and growing your reputation." },
  { id: "payments", label: "Payments", icon: CreditCard, blurb: "Escrow, fees, invoices, VAT and payout timelines." },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, blurb: "Scheduling, changes, cancellations and job status." },
  { id: "quotes", label: "Quotes", icon: FileText, blurb: "Sending, receiving, negotiating and accepting quotes." },
  { id: "verification", label: "Verification", icon: ShieldCheck, blurb: "ID, insurance, DBS and trade qualifications." },
  { id: "technical", label: "Technical Support", icon: LifeBuoy, blurb: "Login issues, app errors, notifications and uploads." },
  { id: "safety", label: "Safety", icon: AlertTriangle, blurb: "Staying safe on-site, reporting concerns and emergencies." },
  { id: "account", label: "Account Management", icon: UserCog, blurb: "Profile, security, notifications and closing your account." },
  { id: "disputes", label: "Disputes", icon: Gavel, blurb: "Opening disputes, evidence and resolution timelines." },
];

const articles: Article[] = [
  // Customers
  { category: "customers", q: "How do I post a job?", a: "Tap 'Get a quote', describe the work, add a few photos and your postcode. Verified pros in your area will send quotes within minutes." },
  { category: "customers", q: "How much does DoneToday cost customers?", a: "Posting a job and comparing quotes is completely free. You only pay the price agreed with your chosen pro." },
  { category: "customers", q: "Can I message a pro before booking?", a: "Yes — every quote opens a secure in-app chat so you can ask questions, share extra photos or agree timings before you book." },
  { category: "customers", q: "How do I choose the right pro?", a: "Compare price, reputation tier (Bronze → Diamond), reviews, verified badges and response time. Higher tiers reflect consistent quality." },

  // Providers
  { category: "providers", q: "How do I become a pro on DoneToday?", a: "Sign up as a pro, complete the onboarding wizard, upload your ID and insurance, and add the services you offer." },
  { category: "providers", q: "Can I offer multiple trades?", a: "Yes. Add as many trades as you're qualified for from Settings → Services. Each trade has its own rates, radius and qualifications." },
  { category: "providers", q: "How do I get more jobs?", a: "Complete your profile 100%, respond to quotes within an hour, keep availability up to date and collect reviews after every job." },
  { category: "providers", q: "How does the reputation tier work?", a: "Tiers are earned from completed jobs, average rating, response time and low cancellation rate. Higher tiers rank higher in search." },

  // Payments
  { category: "payments", q: "How are payments protected?", a: "Customer payments are held in escrow by our payment provider and only released once the job is marked complete." },
  { category: "payments", q: "What fee does DoneToday charge?", a: "Providers pay a 15% platform fee on completed bookings. There are no listing fees, no monthly fees and no charges for customers." },
  { category: "payments", q: "When do providers get paid?", a: "Funds move to your available balance after a short hold and are paid to your linked bank account on your payout schedule (typically within 2 working days)." },
  { category: "payments", q: "Do you support VAT invoices?", a: "Yes. VAT-registered pros can add their VAT number in Settings and invoices will include VAT automatically." },

  // Bookings
  { category: "bookings", q: "How do I reschedule a booking?", a: "Open the job, tap 'Propose new time' and pick a slot. The other party gets a notification and can accept or counter-propose." },
  { category: "bookings", q: "What happens if a pro is late?", a: "Pros update their status (On the way, Arrived) so you always know where you stand. If a pro no-shows, open a dispute for a full refund." },
  { category: "bookings", q: "Can I cancel a confirmed booking?", a: "Yes — free of charge more than 24 hours before the start time. Within 24 hours a small cancellation fee may apply to compensate the pro." },
  { category: "bookings", q: "How do I mark a job complete?", a: "From the job page, tap 'Mark complete' once the work is finished. This releases funds from escrow after the short hold period." },

  // Quotes
  { category: "quotes", q: "How long does a quote stay valid?", a: "Quotes are valid for 7 days by default. Pros can shorten or extend this when submitting." },
  { category: "quotes", q: "Can I negotiate a quote?", a: "Yes. Send a counter-offer from the quote card. The pro can accept, decline or propose a new price." },
  { category: "quotes", q: "Why haven't I received quotes yet?", a: "Try adding more detail and photos, widening your radius or checking that your postcode is correct. Emergency and out-of-hours jobs may take longer." },
  { category: "quotes", q: "Do I have to accept the cheapest quote?", a: "No. Choose the pro you're most confident in — price, reviews, tier and response time all matter." },

  // Verification
  { category: "verification", q: "What documents do pros need to upload?", a: "Government ID, proof of address, public liability insurance, and any trade qualifications (e.g. Gas Safe, NICEIC, DBS)." },
  { category: "verification", q: "How long does verification take?", a: "Most submissions are reviewed within 1 working day. Complex checks (DBS) can take longer." },
  { category: "verification", q: "My document was rejected — what now?", a: "Check the reason in Settings → Verification, upload a clearer copy and resubmit. Our team will review again." },
  { category: "verification", q: "Do you re-check documents?", a: "Yes. Insurance certificates and time-limited qualifications are re-checked before their expiry date." },

  // Technical
  { category: "technical", q: "I can't sign in — what should I do?", a: "Use 'Forgot password' on the sign-in screen. If you signed up with Google, use the Google button. Still stuck? Email support." },
  { category: "technical", q: "Notifications aren't arriving.", a: "Check your device notification settings and in-app preferences under Settings → Notifications. Make sure your email isn't in a spam folder." },
  { category: "technical", q: "My photo won't upload.", a: "Images must be under 20 MB and in JPG, PNG or HEIC. Try Wi-Fi if you're on a slow connection." },
  { category: "technical", q: "The app is showing an error.", a: "Refresh the page, sign out and back in, or clear your browser cache. Persistent errors: use Report a Problem so we can investigate." },

  // Safety
  { category: "safety", q: "How do I stay safe on-site?", a: "Never share personal contact details before booking, keep all messages in-app, and ensure a second adult is present for at-home jobs where possible." },
  { category: "safety", q: "How do I report a safety concern?", a: "Use the Report a Problem form or email support immediately. For life-threatening emergencies, always call 999 first." },
  { category: "safety", q: "What is your safeguarding policy?", a: "We remove any user found to threaten, harass or endanger others. See the Safety Centre for our full standards." },
  { category: "safety", q: "Are pros insured?", a: "Every pro must maintain public liability insurance to trade on DoneToday. Certificates are verified and re-checked before expiry." },

  // Account
  { category: "account", q: "How do I change my email or phone?", a: "Go to Settings → Profile. Changes may require re-verification for security." },
  { category: "account", q: "How do I switch between customer and provider?", a: "You can hold both a customer and a provider account with the same email. Toggle between them from the account menu." },
  { category: "account", q: "How do I delete my account?", a: "Visit our Delete Account page for the request form. We'll remove your personal data subject to legal retention requirements." },
  { category: "account", q: "How do I enable two-factor authentication?", a: "Open Settings → Security and add a phone number or authenticator app. 2FA is strongly recommended for pros." },

  // Disputes
  { category: "disputes", q: "When should I open a dispute?", a: "Open a dispute if the work is incomplete, damaged, unsafe or clearly not what was agreed. Do this before releasing payment." },
  { category: "disputes", q: "How does the dispute process work?", a: "Both parties share evidence in-app, our team reviews impartially, and we mediate a fair outcome — typically within 5 working days." },
  { category: "disputes", q: "Can I appeal a dispute outcome?", a: "Yes. Reply to the resolution email within 14 days with any new evidence and we'll escalate to a senior reviewer." },
  { category: "disputes", q: "What evidence should I provide?", a: "Photos before and after, the original job description, any messages agreed with the other party, receipts and dated timestamps." },
];

function HelpPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<CategoryId | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (active !== "all" && a.category !== active) return false;
      if (!q) return true;
      return a.q.toLowerCase().includes(q) || a.a.toLowerCase().includes(q);
    });
  }, [query, active]);

  const counts = useMemo(() => {
    const map = new Map<CategoryId, number>();
    for (const a of articles) map.set(a.category, (map.get(a.category) ?? 0) + 1);
    return map;
  }, []);

  return (
    <LegalPage
      eyebrow="Help Centre"
      title="How can we help?"
      intro="Search articles or pick a category. Can't find what you need? Email our team and we'll get back to you fast."
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
            active === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({articles.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              active === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <c.icon className="h-3.5 w-3.5" aria-hidden />
            {c.label} ({counts.get(c.id) ?? 0})
          </button>
        ))}
      </div>

      {active === "all" && !query && (
        <Section heading="Browse by category">
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {c.label} <span className="text-muted-foreground">· {counts.get(c.id) ?? 0}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{c.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section
        heading={
          active === "all"
            ? `${filtered.length} article${filtered.length === 1 ? "" : "s"}`
            : `${categories.find((c) => c.id === active)?.label} · ${filtered.length} article${filtered.length === 1 ? "" : "s"}`
        }
      >
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No articles matched your search. Try a different keyword or{" "}
            <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline">
              email support
            </a>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const cat = categories.find((c) => c.id === a.category)!;
              return (
                <details
                  key={`${a.category}-${a.q}`}
                  className="group rounded-2xl border border-border bg-card p-5 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-foreground">
                    <span>{a.q}</span>
                    <span className="inline-flex flex-none items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <cat.icon className="h-3 w-3" aria-hidden /> {cat.label}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{a.a}</p>
                </details>
              );
            })}
          </div>
        )}
      </Section>

      <Section heading="Still need help?">
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">Email support</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{COMPANY.supportEmail} · Mon–Sat, 8am–8pm</span>
            </span>
          </a>
          <Link
            to="/report-problem"
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">Report a problem</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Safety, misconduct, fraud or a technical bug.</span>
            </span>
          </Link>
        </div>
      </Section>
    </LegalPage>
  );
}