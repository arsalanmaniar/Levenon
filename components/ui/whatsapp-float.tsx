"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { shopWhatsAppUrl, SUPPORT_MESSAGE, WHATSAPP_ARIA_LABEL } from "@/lib/whatsapp";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/*
 * The development-only placeholder number and its `console.warn` that used to
 * live here are gone. They existed because no number was configured anywhere,
 * so this button was invisible while the UI around it was built; now
 * `lib/whatsapp.ts` carries a real default, the button renders in every
 * environment, and a second number in a second file is exactly the drift that
 * module was created to prevent.
 */

/**
 * The floating support link.
 *
 * Reachable from anywhere on the site, but three conditions each render
 * nothing rather than a degraded state — a missing corner is honest; a link
 * to `wa.me/undefined` is not:
 *
 *   - no shop number configured (matches the checkout drawer's own rule),
 *   - on `/track`, which already has its own WhatsApp link inline once a
 *     lookup fails — a second, floating one over the same page is noise,
 *     not help,
 *   - while the cart drawer is open, since it would float on top of the
 *     drawer's backdrop and compete with a control the shopper already has
 *     their attention on.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const { isOpen: cartOpen } = useCart();
  const reducedMotion = usePrefersReducedMotion();

  const href = shopWhatsAppUrl(SUPPORT_MESSAGE);

  if (!href || pathname === "/track" || cartOpen) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${WHATSAPP_ARIA_LABEL} — opens in a new tab`}
      className={cn(
        "group fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-ink text-paper shadow-[0_4px_20px_rgb(11_11_13/0.25)] transition-colors duration-200 ease-state hover:bg-purple-700",
        "bottom-6 right-6 md:bottom-10 md:right-10",
      )}
    >
      {/*
        The ring motif, doing the pulse's job instead of a generic glow — a
        purple ring expanding from the button's own edge and fading as it
        grows, echoing the wordmark's "e" rather than a borrowed effect.
        `aria-hidden`: it carries no information the link's accessible name
        doesn't already carry.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full border border-purple-500",
          reducedMotion ? "opacity-40" : "animate-whatsapp-pulse",
        )}
      />
      {/* The accessible name comes from `aria-label` on the anchor, so the
          glyph stays decorative and nothing is announced twice. */}
      <WhatsAppGlyph />
    </a>
  );
}

/** Drawn in the same hairline-stroke register as the rest of the site's icons. */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8.9 19L4 20Z" />
      <path
        d="M8.8 8.6c.2-.5.4-.5.6-.5h.5c.15 0 .35 0 .5.4.2.5.65 1.65.7 1.75.05.15.1.3 0 .5-.1.2-.15.3-.3.45l-.4.45c-.15.15-.3.3-.15.55.15.25.7 1.1 1.5 1.8.9.75 1.5.95 1.75 1.05.25.1.4.1.55-.05.15-.15.65-.7.8-.95.15-.25.3-.2.5-.1.2.05 1.3.6 1.5.7.2.1.35.15.4.25.05.1.05.55-.15 1.05-.2.5-1.15 1-1.6 1.05-.4.05-.9.1-3-.85-2.5-1.15-3.9-3.8-4-4"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
