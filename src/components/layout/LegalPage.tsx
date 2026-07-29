import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-muted-foreground/40">·</span>
          <Link
            to="/"
            className="text-muted-foreground transition hover:text-foreground"
          >
            Home
          </Link>
        </div>
        <header className="mt-6 border-b border-border pb-8">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {intro}
            </p>
          )}
        </header>
        <article className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-foreground">
          {children}
        </article>
        <div className="mt-16 border-t border-border pt-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl tracking-tight text-foreground">
        {heading}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}