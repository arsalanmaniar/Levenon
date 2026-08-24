"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { WhatsAppCheckout } from "./whatsapp-checkout";
import { DiscountField } from "./discount-field";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatMinor, type CartTotals } from "@/lib/cart/types";
import { summariseOrder, type DiscountCode } from "@/lib/cart/discount";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

/**
 * Placeholder threshold for the free-shipping nudge below — no delivery-fee
 * logic exists anywhere in this codebase yet (Priority 7's own brief:
 * "placeholder text, no real logic yet"), so this is a display-only
 * constant, not a real rule pulled from anywhere.
 */
const FREE_SHIPPING_THRESHOLD_MINOR = 1000000; // PKR 10,000

// Brand easing: expo-out in, state-change curve out. No spring, no overshoot.
const EASE_IN = [0.16, 1, 0.3, 1] as const;
const EASE_OUT = [0.65, 0, 0.35, 1] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * The bag, as a right-hand drawer.
 *
 * Modal behaviour is hand-rolled rather than borrowed: Escape closes, focus
 * moves in on open and returns to whatever opened it, Tab is trapped inside, and
 * the page behind is scroll-locked (Lenis included — see lib/scroll-lock).
 *
 * Under reduced motion nothing slides: the panel is simply present or absent.
 */
export function CartDrawer() {
  const { lines, totals, isOpen, closeCart, setQuantity, remove } = useCart();
  const reducedMotion = usePrefersReducedMotion();

  /*
   * The applied code is held here rather than in `CartProvider` for two
   * reasons: nothing outside the bag needs it, and `CartProvider` is Phase 3
   * code that this pass is not authorised to change. `CartDrawer` never
   * unmounts — only the panel inside `AnimatePresence` does — so the code
   * survives the bag being closed and reopened.
   */
  const [discount, setDiscount] = useState<DiscountCode | null>(null);
  const summary = summariseOrder(totals, discount);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Remember the trigger before the drawer steals focus.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    // Take the page behind out of the accessibility tree. The Tab trap below
    // already keeps keyboard focus inside, but a screen reader's virtual cursor
    // ignores focus order — without this it can still read the page underneath.
    const backgrounded: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (rootRef.current && child.contains(rootRef.current)) continue;
      if (child.inert) continue;
      child.inert = true;
      backgrounded.push(child);
    }

    // Focus the close button rather than the panel: a keyboard user's first
    // Tab then lands on the first line item, not back out of the dialog.
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
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
  }, [isOpen, closeCart]);

  const onBackdropClick = useCallback(() => closeCart(), [closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div ref={rootRef} className="fixed inset-0 z-[100]">
          <m.div
            aria-hidden="true"
            onClick={onBackdropClick}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_OUT }}
          />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-hairline bg-paper"
            initial={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{
              duration: reducedMotion ? 0 : 0.5,
              ease: EASE_IN,
            }}
          >
            <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <h2 className="label text-charcoal">
                Your bag
                {totals.itemCount > 0 && ` — ${totals.itemCount}`}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeCart}
                className="label -mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
              >
                Close
              </button>
            </header>

            {lines.length === 0 ? (
              <EmptyBag onClose={closeCart} />
            ) : (
              <>
                <ul className="flex-1 divide-y divide-hairline overflow-y-auto overscroll-contain px-6">
                  {lines.map((line) => (
                    <li key={line.variantSku} className="flex gap-4 py-6">
                      {/* 40×40 thumbnail — the ring motif stands in when the
                          product has no photography, never a blank box. */}
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-hairline bg-paper">
                        {line.imageUrl ? (
                          <Image
                            src={line.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full p-1.5 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                          >
                            <circle cx="12" cy="12" r="7" strokeWidth="1.25" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                            <Link
                              href={`/product/${line.slug}`}
                              onClick={closeCart}
                              className="transition-colors duration-200 ease-state hover:text-purple-500"
                            >
                              {line.name}
                            </Link>
                          </h3>
                          <span className="label whitespace-nowrap text-ink">
                            {formatMinor(
                              line.unitPriceMinor * line.quantity,
                              line.currency,
                            )}
                          </span>
                        </div>

                        <p className="label mt-2 text-charcoal">
                          Size {line.size} · {line.variantSku}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <QuantityStepper
                            quantity={line.quantity}
                            max={line.maxQuantity}
                            label={`${line.name}, size ${line.size}`}
                            onChange={(quantity) =>
                              setQuantity(line.variantSku, quantity)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => remove(line.variantSku)}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                          >
                            <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                            <span className="sr-only">
                              Remove {line.name}, size {line.size}
                            </span>
                          </button>
                        </div>

                        {line.quantity >= line.maxQuantity && (
                          <p className="label mt-3 text-charcoal">
                            All {line.maxQuantity} on the rail
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <FreeShippingProgress subtotalMinor={totals.subtotalMinor} currency={totals.currency} />

                <DiscountField
                  applied={discount}
                  onApply={setDiscount}
                  onClear={() => setDiscount(null)}
                />

                <footer className="border-t border-hairline px-6 py-6">
                  {/*
                    With no code this is the original single Subtotal row. With
                    one, the gross, the reduction and the net are all shown —
                    a shopper should never have to work out what a code did.
                  */}
                  {summary.discountMinor > 0 && summary.currency ? (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="label text-charcoal">Subtotal</span>
                        <span className="label text-charcoal">
                          {formatMinor(summary.subtotalMinor, summary.currency)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="label text-success">
                          {summary.discount?.code}
                        </span>
                        <span className="label text-success">
                          −{formatMinor(summary.discountMinor, summary.currency)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
                        <span className="label text-charcoal">Total</span>
                        <span className="font-display text-xl font-extrabold tracking-[-0.02em]">
                          {formatMinor(summary.totalMinor, summary.currency)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="label text-charcoal">Subtotal</span>
                      <span className="font-display text-xl font-extrabold tracking-[-0.02em]">
                        {totals.currency
                          ? formatMinor(totals.subtotalMinor, totals.currency)
                          : "—"}
                      </span>
                    </div>
                  )}

                  <p className="label mt-3 text-charcoal">
                    Shipping and duties settled on WhatsApp
                  </p>

                  <WhatsAppCheckout className="mt-6" discount={discount} />
                </footer>
              </>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {/* The ring, empty — the motif carrying the empty state. */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        className="h-24 w-24 text-purple-500"
      >
        <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
        <circle
          cx="60"
          cy="60"
          r="26"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="5 7"
        />
      </svg>

      <p className="label mt-8 text-charcoal">Your bag is empty</p>
      <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-charcoal">
        The season is short and every piece is cut in a small run. Start with the
        collection.
      </p>

      <Link
        href="/#collection"
        onClick={onClose}
        className="label mt-8 inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
      >
        Shop Collection
      </Link>
    </div>
  );
}

/**
 * "X away from free shipping" nudge. Display-only per the brief — there is no
 * delivery-fee calculation anywhere in this codebase to hang a real rule off
 * of, so `FREE_SHIPPING_THRESHOLD_MINOR` above is a placeholder, not a price.
 */
function FreeShippingProgress({
  subtotalMinor,
  currency,
}: {
  subtotalMinor: number;
  currency: CartTotals["currency"];
}) {
  if (!currency) return null;

  const remainingMinor = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_MINOR - subtotalMinor,
  );
  const progress = Math.min(
    1,
    subtotalMinor / FREE_SHIPPING_THRESHOLD_MINOR,
  );

  return (
    <div className="px-6 pt-6">
      <p className="label text-charcoal">
        {remainingMinor > 0 ? (
          <>
            {formatMinor(remainingMinor, currency)} away from free shipping
          </>
        ) : (
          <span className="text-success">You&rsquo;ve unlocked free shipping</span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-hairline"
      >
        <div
          className="h-full rounded-full bg-purple-500 transition-[width] duration-300 ease-state"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function QuantityStepper({
  quantity,
  max,
  label,
  onChange,
}: {
  quantity: number;
  max: number;
  label: string;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-hairline">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        className="label inline-flex h-11 w-11 items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
      >
        <span aria-hidden="true">−</span>
        <span className="sr-only">Decrease quantity of {label}</span>
      </button>

      <span className="label w-6 text-center text-ink" aria-live="polite">
        {quantity}
        <span className="sr-only"> in bag</span>
      </span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        className="label inline-flex h-11 w-11 items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500 disabled:cursor-not-allowed disabled:text-charcoal/30 disabled:hover:text-charcoal/30"
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only">Increase quantity of {label}</span>
      </button>
    </div>
  );
}
