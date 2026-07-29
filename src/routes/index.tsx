import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck, Sparkles, Clock, Star, ArrowRight, CheckCircle2,
  Wrench, Leaf, SprayCan, Zap, Hammer, Paintbrush, Truck, Home as HomeIcon,
} from "lucide-react";
import heroImg from "@/assets/hero-provider.jpg";
import logoAsset from "@/assets/donetoday-logo.png.asset.json";



export const Route = createFileRoute("/")({
  component: Index,
});

const categories = [
  { icon: SprayCan, label: "Cleaning" },
  { icon: Leaf, label: "Gardening" },
  { icon: Wrench, label: "Plumbing" },
  { icon: Zap, label: "Electrical" },
  { icon: Hammer, label: "Handyman" },
  { icon: Paintbrush, label: "Painting" },
  { icon: Truck, label: "Removals" },
  { icon: HomeIcon, label: "Home repairs" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">DoneToday</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground">Services</a>
            <a href="#providers" className="text-sm text-muted-foreground hover:text-foreground">For pros</a>
            <a href="#safety" className="text-sm text-muted-foreground hover:text-foreground">Trust & safety</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted md:inline-flex">Sign in</button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              Get a quote <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24 lg:py-32">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Now booking in London
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Local pros,<br />
              <span className="italic text-primary">done today.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Post a job in 60 seconds. Get real quotes from verified professionals nearby. Pay securely — only when the work is done.
            </p>

            {/* Search */}
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row">
              <div className="flex-1 rounded-xl bg-muted/50 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What do you need?</div>
                <input
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="e.g. leaky tap, deep clean, hedge trim…"
                />
              </div>
              <div className="flex-1 rounded-xl bg-muted/50 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Where?</div>
                <input
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="Postcode or address"
                />
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                Get quotes <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> ID & insurance checked</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 fill-accent text-accent" /> 4.9 avg rating</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Reply in 12 min</div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
              <img
                src={heroImg}
                alt="Verified DoneToday professional"
                width={1600}
                height={1400}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 hidden w-64 rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Verified pro</div>
                  <div className="text-xs text-muted-foreground">DBS + insurance on file</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 hidden rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
              <div className="text-xs text-muted-foreground">Quote received</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-foreground">£85</span>
                <span className="text-xs text-muted-foreground">· today, 3pm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">Services</div>
              <h2 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Whatever the job.</h2>
            </div>
            <a href="#" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">Browse all →</a>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c) => (
              <button key={c.label} className="group flex flex-col items-start gap-6 rounded-2xl border border-border bg-background p-6 text-left transition hover:border-primary/30 hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">From £25</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mb-16 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent">How it works</div>
          <h2 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Three steps. Zero faff.</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { n: "01", t: "Post the job", d: "Photos, urgency, address. Takes under a minute." },
            { n: "02", t: "Compare quotes", d: "Verified pros bid with price, timing and reviews." },
            { n: "03", t: "Book & pay securely", d: "Funds held in escrow, released when you're happy." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-8">
              <div className="font-serif text-5xl text-primary/30">{s.n}</div>
              <h3 className="mt-6 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="safety" className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Trust & safety</div>
            <h2 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Built for peace of mind.</h2>
            <p className="mt-6 max-w-md text-primary-foreground/70">
              Every pro on DoneToday is ID-verified, insurance-checked and reviewed after every job. Your money stays protected until the work is signed off.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { i: ShieldCheck, t: "ID verified", d: "Government ID + selfie check on every pro." },
              { i: Sparkles, t: "Insured work", d: "Public liability cover verified on file." },
              { i: Star, t: "Real reviews", d: "Only real, completed bookings can review." },
              { i: CheckCircle2, t: "Escrow payments", d: "Pay only when the job's done right." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
                <f.i className="h-5 w-5 text-accent" />
                <div className="mt-3 font-medium">{f.t}</div>
                <div className="mt-1 text-sm text-primary-foreground/60">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Providers CTA */}
      <section id="providers" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-10 rounded-3xl border border-border bg-card p-10 md:grid-cols-[1.2fr_1fr] md:p-16">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">For professionals</div>
            <h2 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Grow your trade.<br />Keep your calendar full.</h2>
            <p className="mt-6 max-w-lg text-muted-foreground">
              Free to join. Only pay a 10% platform fee on completed jobs. No lead fees, no monthly subs, no games.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Become a pro <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted">See earnings</button>
            </div>
          </div>
          <ul className="space-y-4 border-t border-border pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
            {[
              "Real jobs in your area, priced by you",
              "Secure payouts to your bank within 2 days",
              "Reputation levels that unlock better jobs",
              "Free ID + insurance verification",
            ].map((x) => (
              <li key={x} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold">DoneToday</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Trusted local professionals, on demand.
            </p>
          </div>
          {[
            { h: "Company", l: ["About", "Careers", "Press", "Blog"] },
            { h: "Support", l: ["Help centre", "Trust & safety", "Contact", "Disputes"] },
            { h: "Legal", l: ["Terms", "Privacy", "Cookies", "Provider agreement"] },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-sm font-semibold">{c.h}</div>
              <ul className="mt-4 space-y-2">
                {c.l.map((i) => (
                  <li key={i}><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row">
            <div>© {new Date().getFullYear()} DoneToday Ltd. Registered in England & Wales.</div>
            <div>Made in London.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
