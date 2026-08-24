"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/cn";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { buildOrderMessage } from "@/lib/cart/checkout";
import { shopWhatsAppUrl } from "@/lib/whatsapp";
import { calculateTotals, lineFromVariant } from "@/lib/cart/types";
import { SIZE_ORDER, isInStock, type Product, type Size } from "@/lib/types";

/**
 * Size picker + add to bag, on the product page.
 *
 * Sold-out sizes are shown but not selectable — a customer should see that the
 * piece exists in L and is gone, not silently find L missing. Availability comes
 * from variant stock, never from a flag on the product.
 */
export function AddToCart({ product }: { product: Product }) {
  const { addVariant, quantityOf } = useCart();
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // Transient success state, purely for the micro-interaction. The cart is the
  // source of truth; this only says "that click landed".
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
    },
    [],
  );

  const variants = [...product.variants].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
  );
  const anyStock = isInStock(product);
  const totalStock = variants.reduce((sum, v) => sum + v.stockOnHand, 0);

  const selectedVariant =
    variants.find((variant) => variant.size === selectedSize) ?? null;
  const inBag = selectedVariant ? quantityOf(selectedVariant.sku) : 0;
  const roomLeft = selectedVariant ? selectedVariant.stockOnHand - inBag : 0;
  const atCeiling = selectedVariant !== null && roomLeft <= 0;
  // The quantity stepper can only ever ask for what's actually left once the
  // bag's own count for this variant is accounted for.
  const maxAddable = Math.max(0, roomLeft);

  function handleAdd() {
    if (!selectedVariant) {
      // No native validation bubble — the hint below the picker is the message.
      setAttempted(true);
      return;
    }
    addVariant(product, selectedVariant, quantity);

    setJustAdded(true);
    setQuantity(1);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 2400);
  }

  // A single-line order, built the same way a cart line is — reused rather
  // than re-invented — for the "skip the bag" WhatsApp path. Same gate as
  // "Add to bag": no size, no message to send.
  const whatsAppHref = selectedVariant
    ? shopWhatsAppUrl(
        buildOrderMessage({
          lines: [lineFromVariant(product, selectedVariant, quantity)],
          totals: calculateTotals([
            lineFromVariant(product, selectedVariant, quantity),
          ]),
        }),
      )
    : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="label text-charcoal" id="size-picker-label">
          Sizes
        </h2>
        {/* Availability badge — product-level, visible before any size is
            picked, separate from the size-specific status line below it. */}
        <span
          className={cn(
            "label inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
            anyStock ? "border-hairline text-charcoal" : "border-dashed border-hairline text-charcoal",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("h-1.5 w-1.5 rounded-full", anyStock ? "bg-success" : "bg-charcoal")}
          />
          {anyStock ? `In stock (${totalStock} left)` : "Sold out"}
        </span>
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-2"
        aria-labelledby="size-picker-label"
      >
        {variants.map((variant) => {
          const available = variant.stockOnHand > 0;
          const selected = variant.size === selectedSize;

          return (
            <li key={variant.sku}>
              <button
                type="button"
                disabled={!available}
                aria-pressed={selected}
                onClick={() => {
                  setSelectedSize(variant.size);
                  setAttempted(false);
                  setQuantity(1);
                }}
                className={cn(
                  "label rounded-full border px-5 py-3 transition-colors duration-200 ease-state",
                  !available &&
                    // Dashed edge (not a literal strikethrough) marks sold
                    // out — the stitch motif doing the work. A line through
                    // an 11px mono glyph is unreadable, and the state is
                    // spelled out for screen readers rather than carried by
                    // colour or a hard-to-read line alone.
                    "cursor-not-allowed border-dashed border-hairline text-charcoal",
                  available &&
                    !selected &&
                    "border-hairline text-ink hover:border-purple-500 hover:text-purple-500",
                  available && selected && "border-purple-500 bg-purple-500 text-paper",
                )}
              >
                {variant.size}
                {!available && <span className="sr-only"> — sold out</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="label mt-4 text-charcoal" role="status">
        {!anyStock
          ? "Cut through — join the waitlist"
          : attempted && !selectedVariant
            ? "Pick a size first"
            : selectedVariant
              ? atCeiling
                ? `All ${selectedVariant.stockOnHand} on the rail are in your bag`
                : `${selectedVariant.stockOnHand} left in ${selectedVariant.size}`
              : variants.length === 1
                ? "Sold uncut — one length, ready to cut"
                : `${variants.filter((v) => v.stockOnHand > 0).length} of ${variants.length} sizes on the rail`}
      </p>

      {anyStock && (
        <div className="mt-6">
          <QuantitySelector
            quantity={quantity}
            max={selectedVariant ? maxAddable : undefined}
            onChange={setQuantity}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {anyStock ? (
          <>
            <ShimmerAction
              type="button"
              onClick={handleAdd}
              disabled={atCeiling}
              className="min-h-[56px] w-full py-4"
            >
              <BagGlyph filled={justAdded} />
              {atCeiling
                ? "All of it is in your bag"
                : justAdded
                  ? "Added to bag"
                  : "Add to bag"}
            </ShimmerAction>

            {whatsAppHref ? (
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="label inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-hairline px-6 py-4 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
              >
                {/* `--success` is the one deliberate reuse of a green token
                    for a WhatsApp glyph specifically — SKILL.md §2 reserves
                    it for confirmation states and rules out "success
                    buttons"; the button itself stays ink/hairline/ghost,
                    only the icon carries the colour, as a channel mark
                    rather than a state. */}
                <Phone aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-success" />
                Send via WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setAttempted(true)}
                className="label inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-hairline px-6 py-4 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
              >
                <Phone aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-success" />
                Send via WhatsApp
              </button>
            )}
          </>
        ) : (
          <a
            href="/#stockists"
            className="label inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-hairline px-6 py-4 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
          >
            Join the waitlist
          </a>
        )}
      </div>
    </div>
  );
}

/** +/− stepper, the same shape as the cart drawer's — one control, two places. */
function QuantitySelector({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  /** Undefined before a size is chosen — the stepper still works, capped at 1. */
  max?: number;
  onChange: (quantity: number) => void;
}) {
  const ceiling = max ?? 1;
  return (
    <div className="flex items-center gap-4">
      <span className="label text-charcoal">Quantity</span>
      <div className="flex items-center gap-1 rounded-full border border-hairline">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="label inline-flex h-11 w-11 items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500 disabled:cursor-not-allowed disabled:text-charcoal/30 disabled:hover:text-charcoal/30"
        >
          <span aria-hidden="true">−</span>
          <span className="sr-only">Decrease quantity</span>
        </button>

        <span className="label w-6 text-center text-ink" aria-live="polite">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(ceiling, quantity + 1))}
          disabled={quantity >= ceiling}
          className="label inline-flex h-11 w-11 items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500 disabled:cursor-not-allowed disabled:text-charcoal/30 disabled:hover:text-charcoal/30"
        >
          <span aria-hidden="true">+</span>
          <span className="sr-only">Increase quantity</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Static stand-in for the Rive add-to-cart animation: a bag that fills on
 * success. Also the permanent fallback under reduced motion.
 */
function BagGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M6 8h12l-1 11H7L6 8Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.25 : 0}
        strokeLinejoin="round"
      />
      <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" strokeLinecap="round" />
    </svg>
  );
}
