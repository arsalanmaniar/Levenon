"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const EASE_IN = [0.16, 1, 0.3, 1] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * A small centered dialog, layered above the cart drawer — used for the
 * "Pay by Card" placeholder and the bank-transfer details (client brief,
 * 2026-08-24, replacing the WhatsApp checkout button).
 *
 * Deliberately does not touch `lib/scroll-lock.ts`: this only ever opens from
 * inside the already-open, already-scroll-locked cart drawer, so a second
 * lock/unlock cycle here would restart Lenis out from under the drawer the
 * moment this modal closes while the drawer is still open behind it.
 */
export function PaymentModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

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
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <m.div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-[420px] border border-hairline bg-paper p-6 shadow-[0_24px_60px_-24px_rgba(20,15,10,0.35)] md:p-8"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_IN }}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-h3 font-extrabold tracking-[-0.02em]">
                {title}
              </h3>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
              >
                <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
