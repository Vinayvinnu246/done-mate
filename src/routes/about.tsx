import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  HandCoins,
  Users,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About DoneToday — Local pros, done today" },
      {
        name: "description",
        content:
          "DoneToday, operated by EAGLERA LTD, connects UK households with verified local professionals for cleaning, plumbing, gardening and more — real quotes, secure payments, honest reviews.",
      },
      { property: "og:title", content: "About DoneToday" },
      {
        property: "og:description",
        content:
          "The story behind DoneToday, the UK marketplace for trusted local professionals.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

const STATS = [
  { label: "Service categories", value: "35+" },
  { label: "UK coverage", value: "Nationwide" },
  { label: "Platform fee", value: "15%" },
  { label: "Provider share", value: "85%" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust first",
    text: "Every provider is ID-verified, background-checked and insurance-validated before they can quote on a single job.",
  },
  {
    icon: HandCoins,
    title: "Fair, transparent pricing",
    text: "Customers get real quotes from competing pros. No hidden fees, no guesswork — what you agree is what you pay.",
  },
  {
    icon: HeartHandshake,
    title: "Pros deserve more",
    text: "Providers keep 85% of every job, set their own rates, and get paid through secure escrow-backed withdrawals.",
  },
  {
    icon: Sparkles,
    title: "Done today, not someday",
    text: "From leaky taps to overgrown gardens, we match you with available local pros who can show up the same day.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Post your job",
    text: "Tell us what you need, when you need it, and where. It takes under two minutes and it's free.",
  },
  {
    icon: Star,
    title: "Compare quotes",
    text: "Verified local pros send you quotes with transparent pricing. Compare profiles, reviews and rates side by side.",
  },
  {
    icon: CheckCircle2,
    title: "Book with confidence",
    text: "Pick the pro you trust. Your payment is held securely in escrow until the job is done to your satisfaction.",
  },
  {
    icon: Clock,
    title: "Get it done today",
    text: "Track your pro's arrival in real time, message them directly, and release payment when the work is complete.",
  },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Verified providers",
    text: "ID checks, right-to-work verification and insurance validation on every account.",
  },
  {
    icon: HandCoins,
    title: "Secure escrow payments",
    text: "Funds are held safely and only released when you confirm the job is complete.",
  },
  {
    icon: Star,
    title: "Honest reviews",
    text: "Real reviews from real customers, tied to completed jobs — no fakery, no paid placement.",
  },
  {
    icon: TrendingUp,
    title: "Tiered reputation",
    text: "Pros build reputation from Bronze to Diamond based on real performance, not advertising spend.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4" /> United Kingdom
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
            Local pros, <span className="text-primary">done today.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            DoneToday is a UK marketplace that helps households and businesses
            book verified local professionals in minutes — with real quotes,
            secure payments and honest reviews.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px px-6 py-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our story */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-2xl font-bold md:text-3xl">Our story</h2>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>
            DoneToday started with a simple frustration: why is hiring a good
            tradesperson still a gamble? You ring around, leave voicemails, hope
            someone turns up, and haggle over a price you can't compare. It's
            2026 — getting help at home should feel as easy as ordering a taxi.
          </p>
          <p>
            So we built a marketplace where trust is earned, not assumed. Where
            every professional is verified before they can quote. Where pricing
            is transparent and providers are rewarded for quality, not for
            spending the most on advertising. Where payments are held securely
            until the work is done.
          </p>
          <p>
            Today DoneToday connects thousands of UK households with local pros
            across 35+ trades — from plumbing and electrics to gardening,
            cleaning, carpentry and small builds. And we're just getting
            started.
          </p>
        </div>
      </section>

      {/* Our mission */}
      <section className="bg-primary/5 border-y border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Our mission</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            To make hiring trusted local help effortless — for customers who
            need a job done, and for the skilled professionals who deserve to be
            paid fairly for doing it well.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          What we stand for
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Four principles guide every decision we make on the platform.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-border/60 bg-card p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-bold text-primary">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          Trust &amp; safety, built in
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company info */}
      <section className="border-t border-border/60 bg-primary/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Who we are</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            DoneToday is a trading name of <strong>{COMPANY.legalName}</strong>,
            a company registered in {COMPANY.jurisdiction}. We are headquartered
            in London and operate across the United Kingdom, with plans to
            expand across Europe and beyond.
          </p>
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Questions, partnerships or press? Get in touch
          </a>
        </div>
      </section>
    </div>
  );
}
