"use client";

import { useEffect, type RefObject } from "react";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Everything a modal surface owes its user, in one place.
 *
 * Escape closes; scroll is locked behind it (Lenis included); focus moves in on
 * open and returns to whatever opened it; Tab is trapped inside; and every
 * other top-level element is marked `inert` so a screen reader's virtual cursor
 * cannot wander into the page underneath — a Tab trap alone does not stop that.
 *
 * This is the third surface to need these rules (cart drawer, filter drawer,
 * now the size guide). The first two still carry their own copies; they are
 * frozen while other work is in flight, and folding them in here is a tidy-up
 * for whoever touches them next.
 */
export function useModalBehaviour({
  open,
  onClose,
  panelRef,
  rootRef,
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  /** The dialog panel — the Tab trap searches inside this. */
  panelRef: RefObject<HTMLElement>;
  /** Outermost element of the modal, excluded from the `inert` sweep. */
  rootRef: RefObject<HTMLElement>;
  /** Focused on open. Falls back to the first focusable element in the panel. */
  initialFocusRef?: RefObject<HTMLElement>;
}) {
  useEffect(() => {
    if (!open) return;

    const returnFocusTo = document.activeElement as HTMLElement | null;
    lockScroll();

    const backgrounded: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (rootRef.current && child.contains(rootRef.current)) continue;
      if (child.inert) continue;
      child.inert = true;
      backgrounded.push(child);
    }

    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        null;
      target?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
      returnFocusTo?.focus();
    };
  }, [open, onClose, panelRef, rootRef, initialFocusRef]);
}
