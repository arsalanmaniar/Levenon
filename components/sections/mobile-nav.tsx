"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X, Heart, ShoppingBag, Search, ChevronDown } from "lucide-react";
import { useModalBehaviour } from "@/hooks/use-modal-behaviour";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

const EASE_IN = [0.16, 1, 0.3, 1] as const;

/**
 * Mobile navigation: a hamburger trigger opening a full-screen overlay with
 * every link the desktop centre cluster carries, set large — this replaces
 * the previous pass's single cramped "Shop" text link, which was the only
 * way into the site's other sections below `md` (Atelier, New In, the
 * broader idea of "Collections") without scrolling and hunting.
 *
 * Same modal idiom as the cart drawer, the filter drawer, and the size
 * guide: portal to `<body>`, focus trapped and returned, background `inert`,
 * Escape closes, scroll-locked. One pattern, four places — not a second one
 * invented for this.
 */
const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/new-in", label: "New In" },
  { href: "/atelier", label: "Atelier" },
  { href: "/stockists", label: "Stockists" },
  { href: "/faqs", label: "Help" },
];

// Same three real destinations as the desktop "Collections" dropdown
// (`nav-dropdown.tsx`) — kept in sync by hand rather than shared as a
// constant, since one lives in a client-only file and the other doesn't
// carry category counts a mobile accordion has no room to show anyway.
const COLLECTIONS_SUBLINKS = [
  { href: "/new-in", label: "New In" },
  { href: "/#top-selling", label: "Top Selling" },
  { href: "/collections", label: "By Fabric" },
];

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Accordion state (client brief, 2026-08-29, Item 6: "dropdowns become
  // accordion... in the full-screen mobile menu overlay") — at most one
  // section open at a time, same convention as most mobile nav accordions.
  const [expanded, setExpanded] = useState<"shop" | "collections" | null>(null);
  useEffect(() => setMounted(true), []);

  const { totals, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `mobile-nav-${useId().replace(/:/g, "")}`;

  const close = useCallback(() => {
    setOpen(false);
    setExpanded(null);
  }, []);

  useModalBehaviour({
    open,
    onClose: close,
    panelRef,
    rootRef,
    initialFocusRef: closeRef,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="label inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink md:hidden"
      >
        <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
        <span className="sr-only">Open menu</span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div ref={rootRef} className="fixed inset-0 z-[110] md:hidden">
                <m.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="absolute inset-0 flex flex-col bg-paper"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={reducedMotion ? {} : { opacity: 1 }}
                  exit={reducedMotion ? {} : { opacity: 0 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.35,
                    ease: reducedMotion ? undefined : EASE_IN,
                  }}
                >
                  <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
                    {/* The real wordmark, not the word "Menu" — the drawer is
                        a branded surface, and this is the same shared
                        component the nav and footer use, so the ring and
                        dashed thread come with it. */}
                    <Link href="/" onClick={close} aria-label="Levenon — home">
                      <Wordmark />
                    </Link>
                    <span id={titleId} className="sr-only">
                      Menu
                    </span>
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      className="label -mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                    >
                      <X aria-hidden="true" size={20} strokeWidth={1.5} />
                      <span className="sr-only">Close menu</span>
                    </button>
                  </header>

                  <nav aria-label="Primary" className="flex-1 overflow-y-auto px-6 py-10">
                    <ul className="space-y-2">
                      {LINKS.map((link) => {
                        const accordionKey =
                          link.label === "Shop"
                            ? "shop"
                            : link.label === "Collections"
                              ? "collections"
                              : null;
                        const sublinks =
                          accordionKey === "shop"
                            ? categories.map((category) => ({
                                href: `/shop?category=${category.slug}`,
                                label: category.name,
                              }))
                            : accordionKey === "collections"
                              ? COLLECTIONS_SUBLINKS
                              : null;
                        const isExpanded = accordionKey !== null && expanded === accordionKey;

                        return (
                          <li key={link.label}>
                            {/* Hover: an 8px slide plus a purple dot appearing
                                to the left (client brief, 2026-08-26) — the dot
                                sits in reserved space so the slide never
                                changes the row's own width/wrapping. */}
                            <div className="group flex items-center gap-3 py-3">
                              <Link
                                href={link.href}
                                onClick={close}
                                className="flex flex-1 items-center gap-3 font-display text-4xl font-extrabold tracking-[-0.02em] transition-colors duration-200 ease-state hover:text-purple-500"
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-2 w-2 shrink-0 rounded-full bg-purple-500 opacity-0 transition-opacity duration-200 ease-state group-hover:opacity-100"
                                />
                                <span className="transition-transform duration-200 ease-state group-hover:translate-x-2">
                                  {link.label}
                                </span>
                              </Link>

                              {sublinks && sublinks.length > 0 && (
                                <button
                                  type="button"
                                  aria-expanded={isExpanded}
                                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${link.label}`}
                                  onClick={() =>
                                    setExpanded((current) =>
                                      current === accordionKey ? null : accordionKey,
                                    )
                                  }
                                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                                >
                                  <ChevronDown
                                    aria-hidden="true"
                                    size={20}
                                    strokeWidth={1.5}
                                    className={cn(
                                      "transition-transform duration-200 ease-state",
                                      isExpanded && "rotate-180",
                                    )}
                                  />
                                </button>
                              )}
                            </div>

                            {sublinks && (
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <m.ul
                                    initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: EASE_IN }}
                                    className="overflow-hidden pl-5"
                                  >
                                    {sublinks.map((sublink) => (
                                      <li key={sublink.href}>
                                        <Link
                                          href={sublink.href}
                                          onClick={close}
                                          className="label flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                                        >
                                          {sublink.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </m.ul>
                                )}
                              </AnimatePresence>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/*
                      Secondary actions — the same Search / Wishlist / Bag
                      cluster the desktop nav carries, which below `md` was
                      previously only reachable by closing the menu again.
                      Search routes to the collection grid rather than
                      opening the nav's own combobox: that control lives in
                      the header this overlay is covering, so focusing it
                      from in here would mean dismissing the overlay and
                      then reaching into a sibling component's internals.
                    */}
                    <ul className="mt-12 space-y-1 border-t border-hairline pt-8">
                      <li>
                        <Link
                          href="/shop"
                          onClick={close}
                          className="label flex min-h-[48px] items-center gap-3 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                        >
                          <Search aria-hidden="true" size={18} strokeWidth={1.5} />
                          Search the collection
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/wishlist"
                          onClick={close}
                          className="label flex min-h-[48px] items-center gap-3 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                        >
                          <Heart aria-hidden="true" size={18} strokeWidth={1.5} />
                          Wishlist
                          <span className="text-purple-500">{wishlistCount}</span>
                        </Link>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            // Close first: both surfaces are focus-trapping
                            // modals, and opening the bag while this one is
                            // still mounted would leave two traps fighting
                            // over the same document.
                            close();
                            openCart();
                          }}
                          className="label flex min-h-[48px] w-full items-center gap-3 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                        >
                          <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.5} />
                          Bag
                          <span className="text-purple-500">{totals.itemCount}</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </m.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
