"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Light / dark switch, as mono text.
 *
 * No sun or moon glyph: every other control in this nav is IBM Plex Mono
 * uppercase, and a lone pictogram among them would read as imported from
 * somewhere else. The label names the theme you will get, not the one you are
 * in — a button should say what it does.
 *
 * **Mounted gate.** `resolvedTheme` is undefined on the server and on the first
 * client render, because the real value lives in localStorage and the OS media
 * query, neither of which the server can see. Rendering the label before that
 * resolves would print the wrong word and then correct itself. Instead the
 * button ships with a stable placeholder of the same width, so the nav does not
 * reflow when the real label arrives.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      // Only announce a state once there is a real one to announce.
      aria-label={mounted ? `Switch to ${next} theme` : "Switch theme"}
      /*
       * Hidden below `md`, where the hamburger takes over and the row was
       * measurably crowded — at 390px the wordmark, search, wishlist+count,
       * bag+count, this word and the menu trigger all competed for one line.
       * A theme preference is not a shopping action, so it is the right
       * control to drop from the phone header; nothing is lost, because the
       * OS `prefers-color-scheme` still drives the default there.
       */
      className="label hidden min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-ink md:inline-flex"
    >
      {/*
        `aria-hidden` on the visible word and the real name on the button: the
        four-character label is a fine target for a sighted reader but "LIGHT"
        alone tells a screen reader nothing about what pressing it does.
      */}
      <span aria-hidden="true" className="tabular-nums">
        {mounted ? (isDark ? "Light" : "Dark") : "    "}
      </span>
    </button>
  );
}
