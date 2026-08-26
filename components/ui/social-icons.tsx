"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Branded social glyphs (client brief, 2026-08-27) — real brand colours,
 * which is exactly what rules out `lucide-react` here (that library, and
 * every icon set built on the "one currentColor stroke" convention, is the
 * wrong tool for a logo whose whole identity is a specific gradient or
 * hex). Inline SVG, one file.
 *
 * Each icon takes its own unique gradient/mask id via `useId()` — the
 * fixed desktop sidebar this once shared with the footer is gone (client
 * brief, 2026-08-29: "looks out of place and cheap... footer only"), but a
 * page that ever renders this icon set more than once (nothing does today)
 * would still need unique ids, so the safeguard stays.
 */

export function InstagramIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="28" x2="28" y2="0">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#F77737" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="26" height="26" rx="7" fill={`url(#${gradientId})`} />
      <circle cx="14" cy="14" r="6" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="21.2" cy="6.8" r="1.6" fill="#fff" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="#1877F2" />
      <path
        d="M17 9.3h-1.8c-.6 0-1 .4-1 1.1v1.9h2.7l-.4 2.6h-2.3V22h-2.7v-7.1h-2v-2.6h2v-2.2c0-2 1.2-3.6 3.4-3.6h1.9l.2 2.8Z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * TikTok's own mark has no fixed brand colour the way Instagram/Facebook do
 * (it ships black-on-light or white-on-dark, never a specific hex) — `fill`
 * is `currentColor`, so the two contexts that use this icon set their own
 * colour through a `text-ink`/`text-paper` Tailwind class on `className`
 * (client brief, 2026-08-28: token colours, not a literal `#0B0B0D`/`#FFFFFF`
 * pair) rather than this component hardcoding either. `tone` is gone — it
 * was two hex strings standing in for exactly `text-ink`/`text-paper`.
 */
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.5 3.6c.5 2.2 1.9 3.7 4.2 4v3a7.6 7.6 0 0 1-4.2-1.3v6.9a6 6 0 1 1-6-6c.2 0 .5 0 .7.03v3.05a2.9 2.9 0 1 0 2.3 2.85V3.6h3Z" />
    </svg>
  );
}

const GLOW: Record<string, string> = {
  instagram: "0 0 8px rgba(225,48,108,0.7)",
  facebook: "0 0 8px rgba(24,119,242,0.7)",
  tiktok: "0 0 8px rgba(11,11,13,0.5)",
};

/**
 * Hover scale(1.2) + a brand-coloured `drop-shadow`, 0.25s (client brief) —
 * shared by every social icon instance so the physics stay identical
 * wherever this renders.
 */
export function SocialLink({
  href,
  label,
  brand,
  children,
  className,
}: {
  href: string;
  label: string;
  brand: "instagram" | "facebook" | "tiktok";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      style={{ "--social-glow": GLOW[brand] } as React.CSSProperties}
      className={cn(
        "group inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-transform duration-[250ms] ease-out hover:scale-[1.2]",
        className,
      )}
    >
      <span className="block h-7 w-7 transition-[filter] duration-[250ms] ease-out group-hover:[filter:drop-shadow(var(--social-glow))]">
        {children}
      </span>
    </a>
  );
}
