import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { text: string; icon: string; tagline: string }> = {
  sm: { text: "text-lg", icon: "h-6 w-6", tagline: "text-[9px]" },
  md: { text: "text-xl md:text-2xl", icon: "h-8 w-8", tagline: "text-[10px]" },
  lg: { text: "text-3xl md:text-4xl", icon: "h-12 w-12", tagline: "text-xs" },
};

/** DoneMate wordmark: house-and-tick mark + "Done Mate" lockup. */
export function BrandLogo({
  size = "md",
  className,
  showTagline = false,
}: {
  size?: Size;
  className?: string;
  showTagline?: boolean;
}) {
  const s = sizeMap[size];
  return (
    <span
      aria-label="DoneMate"
      className={cn("inline-flex select-none items-center gap-2.5", className)}
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={cn("shrink-0", s.icon)}
        fill="none"
      >
        <path
          d="M6 22.5 24 7l18 15.5"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 24v16h11"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 27.5 23.5 34 40 15.5"
          stroke="currentColor"
          className="text-accent"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cn("font-sans font-bold tracking-tight", s.text)}>
          <span className="text-foreground">Done</span>{" "}
          <span className="text-accent">Mate</span>
        </span>
        {showTagline && (
          <span className={cn("mt-1 font-medium text-muted-foreground", s.tagline)}>
            Local pros, <span className="text-accent">done</span> today.
          </span>
        )}
      </span>
    </span>
  );
}

export default BrandLogo;
