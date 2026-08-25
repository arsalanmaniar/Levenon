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
            `gap-6` at `md`, opening to `gap-10` at `lg` — a fifth centre
            link ("Stockists", client brief, 2026-08-26) joined the four this
            spacing was originally tuned against; kept as-is since the row
            still fits at `md` with the added label, and `lg` already had
            room to spare.
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
