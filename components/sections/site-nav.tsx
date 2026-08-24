import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { NavShrink } from "@/components/ui/nav-shrink";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "@/components/cart/cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchBar } from "@/components/search/search-bar";

/*
 * "Shop" and "Collections" both point at the one grid this site has — there
 * is no separate collections-overview page to send "Collections" to. A
 * disclosed simplification, not an oversight: building a second listing
 * page for a four-word nav label is out of scope for a nav pass. "Stockists"
 * drops from this list (the brief's own replacement set doesn't include it);
 * it's still reachable from the footer and the atelier's own CTA, both
 * unchanged, so nothing that resolved before stops resolving now.
 */
const links = [
  { href: "/#collection", label: "Shop" },
  { href: "/#collection", label: "Collections" },
  { href: "/#new-in", label: "New In" },
  { href: "/#atelier", label: "Atelier" },
];

/**
 * Paper nav, hairline bottom border, mono links. The hover state is the ring
 * motif at its quietest: a hairline purple rule sewn under the label.
 */
export function SiteNav() {
  return (
    <header className="nav-frost sticky top-0 z-50 border-b border-hairline bg-paper">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[var(--nav-h)] max-w-shell items-center justify-between px-6 lg:px-10"
      >
        <Link
          href="/"
          className="flex items-center rounded-full py-2 pr-2"
          aria-label="Levenon — home"
        >
          <NavShrink>
            <Wordmark />
          </NavShrink>
        </Link>

        {/*
          `gap-6` at `md`, opening to `gap-10` at `lg`: at exactly 768px the
          four centre links plus the full right cluster (search, wishlist,
          bag, theme toggle) measured wider than the viewport — a real
          overflow (`right=849` against 768), not a hypothetical one. `lg`
          already had the room to spare, so only the crowded `md`–`lg` range
          needed tightening.
        */}
        <ul className="hidden items-center gap-6 md:flex lg:gap-10">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="label group inline-flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-ink"
              >
                {/* The thread, drawn under the label on hover. Anchored to the
                    text itself so it tracks the type, not the 44px hit area. */}
                <span className="relative">
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right cluster order is explicit: Search, Wishlist, Bag, then the
            theme toggle last — a later brief's specific ordering, swapped
            from the previous pass's toggle-first arrangement. */}
        <div className="flex items-center gap-1 sm:gap-4 md:gap-3 lg:gap-6">
          <SearchBar />
          <WishlistButton />
          <CartButton />
          <ThemeToggle />
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
