"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Theme plumbing, in its own client module.
 *
 * Kept out of `app/layout.tsx` for the same reason `MotionProvider` is:
 * importing a client library directly from the root server layout makes it an
 * entry point for the root chunk, the shape where tree-shaking is least
 * reliable.
 *
 * `attribute="data-theme"` writes `<html data-theme="dark">`, which is what the
 * `[data-theme="dark"]` block in globals.css keys off. `defaultTheme="system"`
 * means a first-time visitor gets whatever their OS is set to, and
 * `enableSystem` keeps that live if they change it mid-session.
 *
 * Transitions are **not** disabled on theme change. next-themes offers
 * `disableTransitionOnChange` for the flicker you get when hundreds of elements
 * animate their colours at once, but every transition here is on the 200ms
 * state curve and the swap reads as deliberate rather than as a flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark"]}
    >
      {children}
    </NextThemeProvider>
  );
}
