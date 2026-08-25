"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share2 } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Share (client brief, 2026-08-26) — copies the current page URL and shows a
 * bottom-centre toast. `window.location.href` at click time, not a
 * `siteUrl` + slug prop, so it's correct for anything the URL might carry
 * later (a query string, a future variant param) without this component
 * needing to know about it.
 *
 * The toast portals to `<body>` rather than rendering inline — it's a
 * page-level notification, not scoped to wherever this button sits, and a
 * `fixed` element inside this codebase's other `overflow-hidden` ancestors
 * (the PDP gallery, card tiles) could otherwise get clipped.
 */
export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => setMounted(true), []);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) —
      // no toast, but nothing crashes either.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label="Copy link to this piece"
        className={
          className ??
          "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-hairline text-charcoal transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
        }
      >
        <Share2 aria-hidden="true" size={18} strokeWidth={1.5} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {copied && (
              <m.div
                role="status"
                className="pointer-events-none fixed inset-x-0 bottom-8 z-[150] flex justify-center px-6"
                // Enters by sliding up + fading in; exits by fading only —
                // "slides up then fades" (client brief), read as the two
                // halves of one lifecycle rather than the same motion twice.
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3 }}
              >
                <span className="label rounded-full bg-ink px-5 py-3 text-paper shadow-thread">
                  Link copied!
                </span>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
