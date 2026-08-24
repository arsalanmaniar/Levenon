"use client";

import { useCart } from "./cart-provider";
import { buildOrderMessage } from "@/lib/cart/checkout";
import { shopWhatsAppUrl } from "@/lib/whatsapp";
import type { DiscountCode } from "@/lib/cart/discount";
import { cn } from "@/lib/cn";

/**
 * The only checkout channel for now: hand the order to WhatsApp pre-filled.
 *
 * No gateway, no COD, no order record — the shop owner takes it from the chat.
 * Everything that shapes the message lives in lib/cart/checkout.ts so adding a
 * second channel later is a new function there, not a rewrite of this button.
 *
 * If the number is unset or malformed we render an honest disabled state rather
 * than a link to `wa.me/undefined`.
 */
export function WhatsAppCheckout({
  className,
  discount = null,
}: {
  className?: string;
  /** Applied code, passed down from the drawer so it reaches the message. */
  discount?: DiscountCode | null;
}) {
  const { lines, totals } = useCart();

  /*
   * This used to read `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` directly,
   * which meant the checkout resolved the number differently from every other
   * WhatsApp entry point on the site. It now goes through `lib/whatsapp.ts`
   * like the rest, so there is one resolution path and one place to change it.
   */
  const href = shopWhatsAppUrl(buildOrderMessage({ lines, totals, discount }));

  if (lines.length === 0) return null;

  if (!href) {
    return (
      <div className={cn("border border-dashed border-hairline p-4", className)}>
        <p className="label text-charcoal">Checkout unavailable</p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal">
          No shop WhatsApp number is configured. Set{" "}
          <code className="font-mono text-ink">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
          to a full international number and rebuild.
        </p>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "label inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700",
        className,
      )}
    >
      Checkout via WhatsApp
      <span className="sr-only">— opens WhatsApp in a new tab</span>
    </a>
  );
}
