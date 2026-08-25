"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

/**
 * Share (client brief, 2026-08-26) — copies the current page URL and reports
 * it via the global toast. `window.location.href` at click time, not a
 * `siteUrl` + slug prop, so it's correct for anything the URL might carry
 * later (a query string, a future variant param) without this component
 * needing to know about it.
 *
 * Previously had its own bespoke portal + `AnimatePresence` "Link copied!"
 * toast; migrated onto `useToast()` (client brief, 2026-08-28: "replace any
 * inline success states that are currently janky with clean toasts") so
 * there's one toast implementation in the codebase, not two competing ones
 * stacking if both ever fire close together.
 */
export function ShareButton({ className }: { className?: string }) {
  const { showToast } = useToast();

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied", "success");
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) —
      // no toast, but nothing crashes either.
    }
  }

  return (
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
  );
}
