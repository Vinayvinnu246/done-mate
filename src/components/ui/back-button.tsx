import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { homePathForUser } from "@/lib/role-routing";

type BackButtonProps = {
  /** Force a specific destination instead of browser history. */
  to?: string;
  /** Where to go when there is no history to go back to. Defaults to "/". */
  fallbackTo?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  to,
  fallbackTo,
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();
  const { isAuthenticated, profile, roles } = useAuth();
  const safeFallback =
    fallbackTo ?? (isAuthenticated ? homePathForUser(profile, roles) : "/");

  const classes = cn(
    "inline-flex items-center gap-1.5 text-sm font-medium text-[#6b7b8c] hover:text-[#2e4053] transition-colors",
    className,
  );

  const handleClick = () => {
    const target = to ?? safeFallback;
    if (to) {
      router.navigate({ to });
      return;
    }

    const hasHistory =
      typeof window !== "undefined" && window.history.length > 1;

    if (!hasHistory) {
      router.navigate({ to: target });
      return;
    }

    const from = window.location.pathname + window.location.search;
    router.history.back();

    // If nothing actually changed (blocked, redirect loop, or entry outside the
    // app), fall back to a known-good route so the button always does something.
    window.setTimeout(() => {
      if (window.location.pathname + window.location.search === from) {
        router.navigate({ to: target });
      }
    }, 250);
  };

  return (
    <button type="button" onClick={handleClick} className={classes}>
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
