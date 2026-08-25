import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { NavFrame } from "./nav-frame";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "@/components/cart/cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchBar } from "@/components/search/search-bar";

/**
 * Paper nav, hairline bottom border, mono links. The hover state is the ring
 * motif at its quietest: a hairline purple rule sewn under the label.
 *
 * The row's own scroll-shrink and mount-in choreography live in `NavFrame` —
 * see that file for why `--nav-h` itself is untouched.
 */
export function SiteNav() {
  return (
    <header className="nav-frost sticky top-0 z-50 border-b border-hairline bg-paper">
      <NavFrame
        logo={
          <Link
            href="/"
            className="flex items-center rounded-full py-2 pr-2"
            aria-label="Levenon — home"
          >
            {/* ~20px tall (client brief, 2026-08-25) — this is the supplied
                logo artwork, not type, so "Manrope 800" doesn't apply to it;
                see Wordmark's own doc comment for why it stays a raster
                asset rather than being redrawn as text. */}
            <Wordmark className="text-[1.1rem]" />
          </Link>
        }
        links={
          /*
            `gap-6` at `md`, opening to `gap-10` at `lg`: at exactly 768px the
            four centre links plus the full right cluster (search, wishlist,
            bag, theme toggle) measured wider than the viewport — a real
            overflow (`right=849` against 768), not a hypothetical one. `lg`
            already had the room to spare, so only the crowded `md`–`lg` range
            needed tightening.
          */
          <NavLinks />
        }
        actions={
          /* Right cluster order is explicit: Search, Wishlist, Bag, then the
              theme toggle last — a later brief's specific ordering, swapped
              from the previous pass's toggle-first arrangement. */
          <>
            <SearchBar />
            <WishlistButton />
            <CartButton />
            <ThemeToggle />
            <MobileNav />
          </>
        }
      />
    </header>
  );
}
