"use client";

import Link from "next/link";
import { useWishlist } from "./wishlist-provider";
import { WishlistAddToCart } from "./wishlist-add-to-cart";
import { ProductMedia, GRID_IMAGE_SIZES } from "@/components/products/product-media";
import { formatPrice, isInStock } from "@/lib/types";

/**
 * The saved list.
 *
 * Client-rendered because the wishlist lives in memory for the session — there
 * is nothing on the server to prerender. Cards are deliberately simpler than
 * the grid's: no mouse tilt, because this is a working list rather than a
 * shop window, and each row carries its own add-to-cart.
 */
export function WishlistContents() {
  const { items, remove, clear } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center py-12 text-center">
        {/* The ring, empty — same motif as the cart's empty state. */}
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

        <p className="label mt-8 text-charcoal">Nothing saved yet</p>
        <p className="mt-4 max-w-[36ch] text-body leading-relaxed text-charcoal">
          Save a piece from the collection and it waits here for the session.
        </p>

        <Link
          href="/#collection"
          className="label mt-8 inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          See the collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between border-b border-hairline pb-6">
        <p className="label text-charcoal">
          {items.length === 1 ? "1 piece" : `${items.length} pieces`}
        </p>
        <button
          type="button"
          onClick={clear}
          className="label inline-flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
        >
          Clear all
        </button>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <li key={product.id}>
            <article>
              <Link
                href={`/product/${product.slug}`}
                className="block focus-visible:outline-offset-4"
              >
                <div className="relative aspect-[4/5] overflow-hidden border border-hairline bg-paper">
                  <ProductMedia product={product} sizes={GRID_IMAGE_SIZES} />
                  <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                    <span className="label bg-ink px-2.5 py-1 text-paper">
                      Unstitched
                    </span>
                    {!isInStock(product) && (
                      <span className="label bg-paper/90 px-2.5 py-1 text-charcoal">
                        Waitlist
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-card-name font-extrabold tracking-[-0.02em]">
                    {product.name}
                  </h2>
                  <span className="font-display text-card-price font-semibold tracking-tight text-purple-500 whitespace-nowrap">
                    {formatPrice(product)}
                  </span>
                </div>
              </Link>

              <p className="mt-2 max-w-measure text-body leading-relaxed text-charcoal">
                {product.blurb}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <WishlistAddToCart product={product} />
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  className="label inline-flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                >
                  Remove
                  <span className="sr-only"> {product.name} from wishlist</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
