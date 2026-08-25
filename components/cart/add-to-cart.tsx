"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/cn";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { NotifyMe } from "@/components/products/notify-me";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { SIZE_ORDER, isInStock, type Product, type Size } from "@/lib/types";

/**
 * Size picker + add to bag, on the product page.
 *
 * Sold-out sizes are shown but not selectable — a customer should see that the
 * piece exists in L and is gone, not silently find L missing. Availability comes
 * from variant stock, never from a flag on the product.
 *
 * Root cause of the reported "Add to Bag doesn't work" (client brief,
 * 2026-08-25, deep investigation): the dispatch chain itself was never
 * broken — `handleAdd` → `addVariant` → `dispatch({type:"add"})` then
 * `dispatch({type:"open"})` is correct end to end, confirmed by reading the
 * reducer directly. What *was* thin: clicking without a size selected did
 * (and does) nothing but flip a quiet grey status line below the size
 * chips — easy to miss, and indistinguishable from "the button doesn't do
 * anything" to someone not looking there. The fix below is a louder, harder
 * to miss version of the same existing guard, not a new code path.
 */
export function AddToCart({ product }: { product: Product }) {
  const { addVariant, quantityOf } = useCart();
  const reducedMotion = usePrefersReducedMotion();
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // Button state machine (client brief, 2026-08-25): idle → adding →
  // added → idle. "Adding" is held briefly even though the dispatch itself
  // is synchronous — a state a reader can never actually perceive is the
  // same, from their side, as no state at all.
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const statusTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
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
      // The defensive check the brief asks for — this already existed as a
      // quiet status-line change; `attempted` now also drives the louder
      // red text + shake below, so a size-less click is unmissable.
      setAttempted(true);
      return;
    }

    if (statusTimer.current) window.clearTimeout(statusTimer.current);
    setStatus("adding");
    statusTimer.current = window.setTimeout(() => {
      addVariant(product, selectedVariant, quantity);
      setStatus("added");
      setQuantity(1);
      statusTimer.current = window.setTimeout(() => setStatus("idle"), 1500);
    }, 250);
  }

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

      <m.ul
        className="mt-4 flex flex-wrap gap-2"
        aria-labelledby="size-picker-label"
        // Shakes once when a click lands with no size picked — the loud
        // version of the defensive check below (client brief, 2026-08-25).
        animate={
          attempted && !selectedVariant && !reducedMotion
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4 }}
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
      </m.ul>

      <p
        className={cn(
          "label mt-4",
          attempted && !selectedVariant ? "font-semibold text-purple-700" : "text-charcoal",
        )}
        role="status"
      >
        {!anyStock
          ? "Cut through — join the waitlist"
          : attempted && !selectedVariant
            ? "Please select a size first"
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
          <ShimmerAction
            type="button"
            onClick={handleAdd}
            disabled={atCeiling || status === "adding"}
            className="min-h-[56px] w-full py-4"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === "adding" ? (
                <m.span
                  key="adding"
                  className="inline-flex items-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                >
                  <Loader2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 animate-spin" />
                  Adding…
                </m.span>
              ) : status === "added" ? (
                <m.span
                  key="added"
                  className="inline-flex items-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                >
                  <Check aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                  Added to bag
                </m.span>
              ) : (
                <m.span
                  key="idle"
                  className="inline-flex items-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                >
                  <BagGlyph filled={false} />
                  {atCeiling ? "All of it is in your bag" : "Add to bag"}
                </m.span>
              )}
            </AnimatePresence>
          </ShimmerAction>
        ) : (
          // "Notify Me" (client brief, 2026-08-26) — replaces the previous
          // pass's plain "Join the waitlist" link to `/#stockists` with a
          // real back-in-stock signup.
          <NotifyMe productId={product.id} productName={product.name} />
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
