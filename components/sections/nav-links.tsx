"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

/*
 * "Shop" and "Collections" both point at the one grid this site has — see
 * the note in `site-nav.tsx`. Both share `sectionId: "collection"` here too,
 * so either one lights up together while that section is in view.
 */
const links = [
  { href: "/#collection", label: "Shop", sectionId: "collection" },
  { href: "/#collection", label: "Collections", sectionId: "collection" },
  { href: "/#new-in", label: "New In", sectionId: "new-in" },
  { href: "/#atelier", label: "Atelier", sectionId: "atelier" },
];

const SECTION_IDS = ["collection", "new-in", "atelier"];

/**
 * Nav links (client brief, 2026-08-24): Manrope 500, a staggered load-in, and
 * an active state driven by which section is actually in view.
 *
 * Split out of `SiteNav` (which stays a server component) because the active
 * state needs a scrollspy — these anchors are same-page hash links, not
 * distinct routes, so `usePathname()` alone could never tell them apart.
 *
 * Section ids only exist on `/` — on every other route `getElementById`
 * returns null for all three and the observer is simply never created, so
 * nothing here lights up falsely elsewhere on the site.
 */
export function NavLinks() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const targets = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // A band through the middle of the viewport, not the whole thing — a
      // section only counts "active" once it's actually where the reader is
      // looking, not the instant its top edge appears at the bottom.
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <ul className="hidden items-center gap-6 md:flex lg:gap-10">
      {links.map((link, index) => {
        const active = activeId === link.sectionId;
        return (
          <m.li
            key={link.label}
            initial={reducedMotion ? false : { x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: BRAND_EASE }}
          >
            <Link
              href={link.href}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group inline-flex min-h-[44px] items-center font-display text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-200 ease-state",
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
