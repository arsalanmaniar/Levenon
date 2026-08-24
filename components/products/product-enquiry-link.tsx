import { Phone } from "lucide-react";
import {
  productEnquiryMessage,
  shopWhatsAppUrl,
  WHATSAPP_ARIA_LABEL,
} from "@/lib/whatsapp";

/**
 * "Ask on WhatsApp" for a single piece.
 *
 * A server component with no state: the message is built from the product name
 * at render time, so this ships no client JavaScript at all — worth caring
 * about on a page where per-component hydration is already the largest cost on
 * mobile.
 *
 * Renders nothing when no number is configured, matching every other WhatsApp
 * entry point on the site rather than linking to `wa.me/undefined`.
 */
export function ProductEnquiryLink({ productName }: { productName: string }) {
  const href = shopWhatsAppUrl(productEnquiryMessage(productName));
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${WHATSAPP_ARIA_LABEL} about ${productName} — opens in a new tab`}
      className="label group inline-flex min-h-[44px] items-center gap-2 text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
    >
      {/* Same channel-mark reasoning as the order button in `add-to-cart.tsx`:
          `--success` tints the glyph only, never the control. */}
      <Phone aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-success" />
      <span className="relative">
        Ask on WhatsApp
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100" />
      </span>
    </a>
  );
}
