"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * Light / dark switch — a pill toggle (client brief, 2026-08-26), replacing
 * the previous pass's plain mono-text label.
 *
 * `showLabel` is the difference between the two places this renders: the nav
 * wants icon-only (no room to spare there — see the old label's own note on
 * the row being crowded at `md`), the footer wants the word alongside it.
 * One component, one source of the toggle's actual behaviour, either way.
 *
 * **Mounted gate**, unchanged from the previous version: `resolvedTheme` is
 * undefined on the server and the first client render, since the real value
 * lives in localStorage and the OS media query, neither visible to the
 * server. The pill still renders pre-mount (there is no text to get wrong
 * the way the old label had), just resting at its light-mode position until
 * the real theme resolves, so there's no layout jump either way.
 */
export function ThemeToggle({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [ripple, setRipple] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  function handleToggle() {
    setTheme(next);
    // Reduced motion: instant switch, no ripple at all (client brief) —
    // never constructed, not run at zero duration.
    if (reducedMotion) return;
    setRipple(true);
    window.setTimeout(() => setRipple(false), 500);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={mounted ? `Switch to ${next} theme` : "Switch theme"}
      aria-pressed={mounted ? isDark : undefined}
      className={cn(
        "group relative inline-flex min-h-[44px] items-center gap-3",
        // Hidden below `md`, same as before — a theme preference isn't a
        // shopping action, and the OS `prefers-color-scheme` still drives
        // the default on a phone.
        showLabel ? "" : "hidden md:inline-flex",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ease-state",
          isDark ? "bg-purple-500" : "bg-ink",
        )}
      >
        <Sun
          aria-hidden="true"
          size={12}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-1.5 text-paper/70"
        />
        <Moon
          aria-hidden="true"
          size={12}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-1.5 text-paper/70"
        />
        <m.span
          aria-hidden="true"
          className={cn(
            "absolute left-0.5 h-5 w-5 rounded-full bg-paper",
            isDark && "shadow-[0_0_8px_2px_rgba(124,42,232,0.55)]",
          )}
          animate={{ x: isDark ? 24 : 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 400, damping: 28 }
          }
        />
        {ripple && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-purple-500/40 animate-theme-ripple"
          />
        )}
      </span>
      {showLabel && (
        <span
          aria-hidden="true"
          className="label tabular-nums text-charcoal transition-colors duration-200 ease-state group-hover:text-paper"
        >
          {mounted ? (isDark ? "Dark" : "Light") : "Light"}
        </span>
      )}
    </button>
  );
}
