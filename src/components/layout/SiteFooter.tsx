import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

import logoAsset from "@/assets/donetoday-logo.png.asset.json";
import { COMPANY } from "@/lib/company";

type Col = { h: string; l: { label: string; to: string; badge?: string }[] };

const columns: Col[] = [
  {
    h: "Company",
    l: [
      { label: "About DoneMate", to: "/about" },
      { label: "Careers", to: "/careers", badge: "Soon" },
      { label: "Contact us", to: "/contact" },
      { label: "Blog", to: "/blog", badge: "Soon" },
    ],
  },
  {
    h: "Legal",
    l: [
      { label: "Privacy policy", to: "/privacy" },
      { label: "Terms & conditions", to: "/terms" },
      { label: "Cookie policy", to: "/cookies" },
      { label: "Provider terms", to: "/provider-terms" },
      { label: "Customer terms", to: "/customer-terms" },
      { label: "Refund policy", to: "/refund-policy" },
      { label: "Dispute resolution", to: "/dispute-resolution" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
  {
    h: "Support",
    l: [
      { label: "Help centre", to: "/help" },
      { label: "FAQs", to: "/faqs" },
      { label: "Safety centre", to: "/safety" },
      { label: "Report a problem", to: "/report-problem" },
      { label: "Trust & verification", to: "/trust-safety" },
    ],
  },
];

const socials = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Twitter, label: "X (Twitter)", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <img
            src={logoAsset.url}
            alt="DoneMate"
            width={160}
            height={56}
            className="h-12 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Trusted local professionals, on demand. Post a job, compare quotes, pay
            securely — DoneMate.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {columns.map((c) => (
          <div key={c.h}>
            <div className="text-sm font-semibold">{c.h}</div>
            <ul className="mt-4 space-y-2">
              {c.l.map((i) => (
                <li key={i.label}>
                  <Link
                    to={i.to as LinkProps["to"]}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {i.label}
                    {i.badge && (
                      <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {i.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <div>
            © {new Date().getFullYear()} {COMPANY.legalName}, trading as {COMPANY.tradingName}.
            Registered in {COMPANY.jurisdiction}.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-foreground">
              {COMPANY.supportEmail}
            </a>
            <span>·</span>
            <span>Made in London</span>
          </div>
        </div>
      </div>
    </footer>
  );
}