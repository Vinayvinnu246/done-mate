import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { homePathForUser } from "@/lib/role-routing";
import { setCustomerMode } from "@/hooks/use-role-guard";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Header() {
  const { isAuthenticated, user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProvider = profile?.type === "provider";
  const homePath = homePathForUser(profile, roles);
  const logoTo = "/";

  const goHome = () => navigate({ to: homePath });

  const switchToCustomerMode = () => {
    setCustomerMode(true);
    setMobileOpen(false);
    navigate({ to: "/" });
  };

  const goGetQuote = () => {
    setMobileOpen(false);
    if (!isAuthenticated) {
      navigate({
        to: "/auth",
        search: { mode: "signup", role: "customer", next: "/post-job" },
      });
      return;
    }
    if (isProvider) {
      navigate({ to: "/post-job" }); // guard on the page shows the switch-account message
      return;
    }
    navigate({ to: "/post-job" });
  };

  const navLinks = [
    { href: "#how", label: "How it works" },
    { href: "#categories", label: "Services" },
    { href: "#providers", label: "For pros" },
    { href: "#safety", label: "Trust & safety" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to={logoTo} className="flex items-center">
          <BrandLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/providers"
            search={{ q: "", category: "", city: "" }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Find providers
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={goHome}
              >
                Dashboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-2 rounded-full"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">
                      {user?.email ?? "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={goHome}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    Profile
                  </DropdownMenuItem>
                  {isProvider && (
                    <DropdownMenuItem onClick={switchToCustomerMode}>
                      Switch to customer mode
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => navigate({ to: "/auth" })}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="inline-flex items-center gap-1.5 rounded-full"
                onClick={goGetQuote}
              >
                Get a quote <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <button
            className="inline-flex flex-col justify-center gap-1.5 p-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="block h-0.5 w-6 bg-foreground" />
            <span className="block h-0.5 w-6 bg-foreground" />
            <span className="block h-0.5 w-4 bg-foreground" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {isAuthenticated ? (
              <>
                <button
                  className="text-left text-sm font-medium text-foreground"
                  onClick={() => {
                    setMobileOpen(false);
                    goHome();
                  }}
                >
                  Dashboard
                </button>
                {isProvider && (
                  <button
                    className="text-left text-sm text-muted-foreground"
                    onClick={switchToCustomerMode}
                  >
                    Switch to customer mode
                  </button>
                )}
                <button
                  className="text-left text-sm text-destructive"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-left text-sm font-medium text-foreground"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate({ to: "/auth" });
                  }}
                >
                  Sign in
                </button>
                <button
                  className="text-left text-sm font-medium text-primary"
                  onClick={goGetQuote}
                >
                  Get a quote
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="hidden gap-8 md:flex">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-20 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </header>
  );
}
