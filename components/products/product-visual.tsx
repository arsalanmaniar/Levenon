import type { VisualVariant } from "@/lib/types";

/**
 * Phase 1 stand-in for product photography: line art built from the four thread
 * forms. No network requests, no layout shift, and it keeps the grid on-brand
 * instead of filling it with grey boxes.
 *
 * Phase 2 replaces this component with the real image, nothing else changes.
 */
export function ProductVisual({ variant }: { variant: VisualVariant }) {
  return (
    <svg
      viewBox="0 0 320 400"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="h-full w-full text-purple-500"
      preserveAspectRatio="xMidYMid slice"
    >
      {variant === "ring" && (
        <g>
          <circle cx="160" cy="200" r="86" strokeWidth="1.25" />
          <circle cx="160" cy="200" r="58" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="5 7" />
          <path d="M160 114c47 0 86 39 86 86" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {variant === "stitch" && (
        <g strokeWidth="1" strokeDasharray="6 9" strokeOpacity="0.65">
          <path d="M56 132h208" />
          <path d="M56 176h208" strokeOpacity="0.45" />
          <path d="M56 220h208" strokeOpacity="0.3" />
          <path d="M56 264h208" strokeOpacity="0.2" />
          <path
            d="M56 88c52 0 52 24 104 24s52-24 104-24"
            strokeDasharray="none"
            strokeWidth="1.5"
            strokeOpacity="1"
          />
        </g>
      )}

      {variant === "knot" && (
        // Two interlocking loops — a chain link, the thread tied to itself.
        <g strokeWidth="1.25">
          <circle cx="160" cy="152" r="58" />
          <circle cx="160" cy="248" r="58" />
          <path
            d="M160 94a58 58 0 0 1 0 116"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="160" cy="200" r="94" strokeOpacity="0.28" strokeDasharray="5 8" />
        </g>
      )}

      {variant === "seam" && (
        <g strokeWidth="1.25">
          <path d="M160 60v280" strokeOpacity="0.55" strokeDasharray="7 9" />
          <path d="M112 60c0 70 96 140 96 280" strokeOpacity="0.85" />
          <path d="M208 60c0 70-96 140-96 280" strokeOpacity="0.3" />
        </g>
      )}
    </svg>
  );
}
