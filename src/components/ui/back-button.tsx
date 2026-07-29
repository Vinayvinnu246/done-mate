import { useRouter, useCanGoBack, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  to?: string;
  label?: string;
  className?: string;
};

export function BackButton({ to, label = "Back", className }: BackButtonProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const classes = cn(
    "inline-flex items-center gap-1.5 text-sm font-medium text-[#6b7b8c] hover:text-[#2e4053] transition-colors",
    className,
  );

  if (to || !canGoBack) {
    return (
      <Link to={to ?? "/"} className={classes}>
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.history.back()} className={classes}>
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}