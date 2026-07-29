import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  FileText,
  CalendarCheck,
  MessageSquare,
  Wallet,
  Star,
  User,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Menu,
  X,
} from "lucide-react";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Find jobs", icon: Search },
  { to: "/quotes", label: "Quotes", icon: FileText },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/wallet", label: "Earnings", icon: Wallet },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/support", label: "Support", icon: LifeBuoy },
] as const;

export function ProviderShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 lg:py-8 lg:flex lg:gap-8">
        <button
          onClick={() => setOpen((s) => !s)}
          className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#2e4053]"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Provider menu
        </button>

        <aside
          className={cn(
            "lg:w-60 lg:shrink-0 lg:block",
            open ? "block mb-4" : "hidden",
          )}
        >
          <nav className="rounded-2xl bg-white border border-[#E5E7EB] p-2 sticky top-20">
            {nav.map((item) => {
              const active =
                item.to === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[#2e4053] text-white"
                      : "text-[#4a5563] hover:bg-[#F3F4F6]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 sm:p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-[#59914c]/10 grid place-items-center mb-4">
        <ShieldCheck className="h-6 w-6 text-[#59914c]" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-[#2e4053]">{title}</h1>
      <p className="text-[#6b7b8c] mt-2 max-w-md mx-auto">{description}</p>
      <p className="text-xs text-[#a0a8b3] mt-6 uppercase tracking-wider">Rolling out in the next phase</p>
    </div>
  );
}