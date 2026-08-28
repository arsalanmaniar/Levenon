"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  NavDropdown,
  ShopMegaMenuPanel,
  CollectionsDropdownPanel,
  type ShopMenuCategory,
} from "./nav-dropdown";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

/*
 * Real routes (client brief, 2026-08-26) — these used to be same-page hash
 * anchors into the home page's own sections; each now has its own page (see
 * `app/shop`, `app/collections`, `app/new-in`, `app/atelier`,
 * `app/stockists`). The home page keeps its own inline sections unchanged —
 * this only changes where the nav sends a reader.
 *
 * "Shop" and "Collections" additionally carry a hover mega-menu (client
 * brief, 2026-08-29, Item 6) — see `nav-dropdown.tsx`.
 */
const links = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/new-in", label: "New In" },
  { href: "/atelier", label: "Atelier" },
  { href: "/stockists", label: "Stockists" },
  { href: "/faqs", label: "Help" },
];

/**
 * Nav links: Manrope 500, a staggered load-in, and an active state.
 *
 * Active state now comes from `usePathname()` — a real route match — rather
 * than the previous pass's `IntersectionObserver` scrollspy, which only made
 * sense while these were anchors into one page's own sections. Still a
 * client component: `usePathname()` needs one, and so does the load-in
 * stagger.
 *
 * `shopMenu` arrives from `SiteNav` (a server component, so it can read the
 * catalogue) — category counts and the two featured pieces are not
 * something a client component can fetch itself without a second request.
 */
export function NavLinks({
  shopMenu,
}: {
  shopMenu?: { categories: ShopMenuCategory[]; featured: Product[] };
}) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <ul className="hidden items-center gap-6 md:flex lg:gap-10">
      {links.map((link, index) => {
        const active = pathname === link.href;

        if (link.label === "Shop" && shopMenu) {
          return (
            <NavDropdown
              key={link.label}
              index={index}
              label={link.label}
              href={link.href}
              active={active}
              panel={
                <ShopMegaMenuPanel
                  categories={shopMenu.categories}
                  featured={shopMenu.featured}
                />
              }
            />
          );
        }

        if (link.label === "Collections") {
          return (
            <NavDropdown
              key={link.label}
              index={index}
              label={link.label}
              href={link.href}
              active={active}
              panel={<CollectionsDropdownPanel />}
            />
          );
        }

        return (
          <m.li
            key={link.label}
            initial={reducedMotion ? false : { x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: BRAND_EASE }}
          >
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                // 12px fixed, not clamp — "nav is fixed height" (client
                // brief, 2026-08-28).
                "group inline-flex min-h-[44px] items-center font-display text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-200 ease-state",
                active ? "text-purple-500" : "text-charcoal hover:text-ink",
              )}
            >
              {/* The thread, drawn under the label — always on for the
                  active link, hover-revealed otherwise. Anchored to the text
                  itself so it tracks the type, not the 44px hit area. */}
              <span className="relative">
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-purple-500 transition-transform duration-300 ease-enter",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </span>
            </Link>
          </m.li>
        );
      })}
    </ul>
  );
}
