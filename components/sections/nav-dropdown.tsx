"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import { formatPrice, type Category, type Product } from "@/lib/types";

const PANEL_EASE = [0.16, 1, 0.3, 1] as const;
const BRAND_EASE = [0.16, 1, 0.3, 1] as const;
// Grace period between leaving the trigger and entering the panel — the two
// are visually separated (the panel starts at the header's own bottom edge,
// not the link's), so an instant close-on-leave flickers shut on the small
// gap between them before the pointer ever reaches the panel. 150ms is
// enough to cross that gap without making a deliberate leave feel sticky.
const CLOSE_GRACE_MS = 150;

/**
 * One nav dropdown trigger + panel (client brief, 2026-08-29, Item 6) —
 * "Shop" and "Collections" both use this; the other three nav links stay
 * plain `<Link>`s in `nav-links.tsx`.
 *
 * The panel is a DOM descendant of this `<li>` but positioned `absolute`
 * against the nearest *positioned* ancestor — `SiteNav`'s `<header>`
 * (`relative`), not this `<li>` (deliberately left unpositioned) — so
 * `left-0 right-0` resolves to the header's own full width rather than the
 * link's narrow one, which is what "full-width (100vw)" actually needs.
 *
 * Opens on hover or focus, closes on mouse-leave (with the grace period
 * above) or on blur once focus genuinely leaves the subtree, and closes on
 * Escape — the brief names hover/Escape explicitly; focus/blur handling is
 * this component's own addition so a keyboard user, who cannot hover,
 * still has a way in and a way out.
 */
export function NavDropdown({
  label,
  href,
  active,
  panel,
  index,
}: {
  label: string;
  href: string;
  active: boolean;
  panel: ReactNode;
  /** Position among the nav's own links — drives the same load-in stagger `nav-links.tsx` uses for its plain links. */
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_GRACE_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <m.li
      ref={rootRef}
      initial={reducedMotion ? false : { x: 10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: BRAND_EASE }}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <Link
        href={href}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group inline-flex min-h-[44px] items-center font-display text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-200 ease-state",
          active ? "text-purple-500" : "text-charcoal hover:text-ink",
        )}
      >
        <span className="relative">
          {label}
          <span
            className={cn(
              "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-purple-500 transition-transform duration-300 ease-enter",
              active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
            )}
          />
        </span>
      </Link>

      <AnimatePresence>
        {open && (
          <m.div
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: PANEL_EASE }}
            className="absolute left-0 right-0 top-full z-40 overflow-hidden border-t-2 border-purple-500 bg-paper shadow-[0_20px_40px_rgb(var(--ink-rgb)/0.1)]"
          >
            <div className="mx-auto max-w-shell px-12 py-8">{panel}</div>
          </m.div>
        )}
      </AnimatePresence>
    </m.li>
  );
}

export type ShopMenuCategory = { category: Category; count: number };

/**
 * "Shop" panel content: categories with counts on the left, two featured
 * pieces on the right, "View All" underneath (client brief, 2026-08-29).
 */
export function ShopMegaMenuPanel({
  categories,
  featured,
}: {
  categories: ShopMenuCategory[];
  featured: Product[];
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-12">
        <ul className="space-y-1">
          {categories.map(({ category, count }) => (
            <li key={category.id}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="group flex items-baseline justify-between gap-4 rounded-sm px-2 py-2.5 transition-colors duration-200 ease-state hover:bg-hairline/40"
              >
                <span className="font-display text-base font-semibold text-ink transition-colors duration-200 ease-state group-hover:text-purple-500">
                  {category.name}
                </span>
                <span className="label text-charcoal">{count}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-4">
          {featured.map((product) => {
            const image = product.images[0];
            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="group">
                <div className="relative h-[160px] w-[120px] overflow-hidden border border-hairline bg-paper">
                  {image && (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-2 max-w-[120px] truncate text-xs font-semibold text-ink">
                  {product.name}
                </p>
                <p className="font-mono text-[11px] text-charcoal">{formatPrice(product)}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 border-t border-hairline pt-5">
        <Link
          href="/shop"
          className="label inline-flex items-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500"
        >
          View All →
        </Link>
      </div>
    </div>
  );
}

const COLLECTIONS_LINKS = [
  { href: "/new-in", label: "New In" },
  { href: "/#top-selling", label: "Top Selling" },
  { href: "/collections", label: "By Fabric" },
];

/**
 * "Collections" panel — a short list, not a mega layout (client brief,
 * 2026-08-29). The brief's own fourth item, "Sale", has no real destination
 * behind it: nothing in this catalogue is marked discounted, and every other
 * link on this site resolves to something real rather than a page with no
 * content behind it (see `site-footer.tsx`'s own note on the same rule) —
 * so three items ship, not four, disclosed rather than inventing a page.
 */
export function CollectionsDropdownPanel() {
  return (
    <ul className="max-w-[220px] space-y-1">
      {COLLECTIONS_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="block rounded-sm px-2 py-2.5 font-display text-base font-semibold text-ink transition-colors duration-200 ease-state hover:bg-hairline/40 hover:text-purple-500"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
