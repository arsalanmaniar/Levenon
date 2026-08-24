import { cn } from "@/lib/cn";

/**
 * The loader: the ring from the wordmark, drawn as a rotating open arc.
 *
 * No browser spinner anywhere on this site (SKILL.md §5.1). The rotation is a
 * CSS animation, so `prefers-reduced-motion` in globals.css freezes it to a
 * static ring without any JS involved.
 */
export function ThreadLoader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 text-purple-500", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        className="h-4 w-4 animate-thread-spin"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" strokeOpacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="label text-charcoal" role="status">
        {label}
      </span>
    </div>
  );
}
