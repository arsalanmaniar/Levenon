"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { cn } from "@/lib/cn";

// Brand easing: expo-out in, state-change curve for the scrim.
const EASE_IN = [0.16, 1, 0.3, 1] as const;
const EASE_OUT = [0.65, 0, 0.35, 1] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

type FilterDrawerProps = {
  /** Number of filters currently on, shown on the trigger. */
  activeCount: number;
  /** Pieces the current filters match, shown on the confirm button. */
  resultCount: number;
  /** URL with every filter removed. */
  clearHref: string;
  /** The filter panel itself — a Server Component passed straight through. */
  children: React.ReactNode;
  className?: string;
};

/**
 * The filter panel as a slide-up drawer, for viewports too narrow to hold it
 * inline.
 *
 * Modal behaviour follows components/cart/cart-drawer.tsx exactly — one modal
 * pattern on this site, not two: Escape closes, focus moves in on open and
 * returns to the trigger, Tab is trapped inside, the page behind is `inert` for
 * the screen-reader cursor, and scrolling is locked through lib/scroll-lock so
 * Lenis stops writing positions.
 *
 * It renders through a portal into `document.body` for one specific reason: the
 * `inert` sweep walks the body's children, and a drawer nested inside the page
 * would be a descendant of the very element it needs to deaden.
 *
 * The panel inside stays live while open — picking a category navigates
 * underneath and the drawer re-renders with the new state — so a reader can set
 * several filters in one pass and confirm once.
 *
 * Under reduced motion no animation is constructed at all: no `AnimatePresence`,
 * no `m` element, no zero-duration tween. The drawer is simply there.
 */
export function FilterDrawer({
  activeCount,
  resultCount,
  clearHref,
  children,
  className,
}: FilterDrawerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => setMounted(true), []);

  // Remember the trigger before the drawer steals focus.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    // Take the page behind out of the accessibility tree. The Tab trap keeps
    // keyboard focus inside, but a screen reader's virtual cursor ignores focus
    // order and would otherwise read straight through the page underneath.
    const backgrounded: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (rootRef.current && child.contains(rootRef.current)) continue;
      if (child.inert) continue;
      child.inert = true;
      backgrounded.push(child);
    }

    // Focus the close button rather than the panel: the first Tab then lands on
    // the first filter control instead of back out of the dialog.
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      for (const element of backgrounded) element.inert = false;
      unlockScroll();
      returnFocusRef.current?.focus();
    };
  }, [isOpen, close]);

  // The trigger is hidden from `lg` up, where the panel is already inline. If
  // the viewport grows while the drawer is open, close it rather than leaving a
  // modal on screen with no visible way back to it.
  useEffect(() => {
    if (!isOpen) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    if (mql.matches) close();
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [isOpen, close]);

  const titleId = `${useId().replace(/:/g, "")}-filters-title`;

  const panelBody = (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <h2 id={titleId} className="label text-charcoal">
          Filters
          {activeCount > 0 && ` — ${activeCount}`}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          className="label -mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8">
        {children}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-4">
        {activeCount > 0 ? (
          <Link
            href={clearHref}
            scroll={false}
            className="label inline-flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
          >
            Clear all
          </Link>
        ) : (
          <span className="label text-charcoal">No filters on</span>
        )}

        <button
          type="button"
          onClick={close}
          className="label inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          {resultCount === 1 ? "Show 1 piece" : `Show ${resultCount} pieces`}
        </button>
      </footer>
    </>
  );

  const panelClass =
    "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col border-t border-hairline bg-paper";

  const overlay = reducedMotion ? (
    isOpen && (
      <div ref={rootRef} className="fixed inset-0 z-[100]">
        <div
          aria-hidden="true"
          onClick={close}
          className="absolute inset-0 bg-ink/25"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={panelClass}
        >
          {panelBody}
        </div>
      </div>
    )
  ) : (
    <AnimatePresence>
      {isOpen && (
        <div ref={rootRef} className="fixed inset-0 z-[100]">
          <m.div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={panelClass}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: EASE_IN }}
          >
            {panelBody}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "label inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 transition-colors duration-200 ease-state",
          activeCount > 0
            ? "border-purple-500 text-purple-500"
            : "border-hairline text-charcoal hover:border-purple-500 hover:text-purple-500",
          className,
        )}
      >
        <SlidersHorizontal aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        Refine
        {activeCount > 0 && ` — ${activeCount}`}
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
