import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { NavShrink } from "@/components/ui/nav-shrink";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "@/components/cart/cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchBar } from "@/components/search/search-bar";

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
        <NavLinks />

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
