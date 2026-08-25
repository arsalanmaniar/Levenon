"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

/*
 * Real routes (client brief, 2026-08-26) — these used to be same-page hash
 * anchors into the home page's own sections; each now has its own page (see
 * `app/shop`, `app/collections`, `app/new-in`, `app/atelier`,
 * `app/stockists`). The home page keeps its own inline sections unchanged —
 * this only changes where the nav sends a reader.
 */
const links = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/new-in", label: "New In" },
  { href: "/atelier", label: "Atelier" },
  { href: "/stockists", label: "Stockists" },
];

/**
 * Nav links: Manrope 500, a staggered load-in, and an active state.
 *
 * Active state now comes from `usePathname()` — a real route match — rather
 * than the previous pass's `IntersectionObserver` scrollspy, which only made
 * sense while these were anchors into one page's own sections. Still a
 * client component: `usePathname()` needs one, and so does the load-in
 * stagger.
 */
export function NavLinks() {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <ul className="hidden items-center gap-6 md:flex lg:gap-10">
      {links.map((link, index) => {
        const active = pathname === link.href;
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
                "group inline-flex min-h-[44px] items-center font-display text-nav font-medium uppercase tracking-[0.08em] transition-colors duration-200 ease-state",
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
