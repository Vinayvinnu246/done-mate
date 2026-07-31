import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "text-xl",
  md: "text-2xl md:text-[1.75rem]",
  lg: "text-3xl md:text-4xl",
};

/**
 * Temporary text-based DoneMate wordmark.
 * Swap the inner markup for an <img>/<svg> when the final logo lands —
 * the props API can stay exactly the same.
 */
export function BrandLogo({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <span
      aria-label="DoneMate"
      className={cn(
        "select-none font-serif font-semibold leading-none tracking-tight text-foreground",
        sizeMap[size],
        className,
      )}
    >
      Done<span className="italic text-primary">Mate</span>
    </span>
  );
}

export default BrandLogo;
