import { ProductVisual } from "./product-visual";
import { ProductPhoto } from "./product-photo";
import type { Product } from "@/lib/types";

/**
 * Product imagery, with the thread-motif line art as the standing fallback.
 *
 * Two ways to end up on the line art, and both are intentional:
 *   1. The row has no photography (`images` is empty) — decided here, on the
 *      server, so nothing ships to the browser at all.
 *   2. The photograph fails to load — decided in `ProductPhoto`, which is the
 *      one small client island in this path.
 *
 * `fill` is used because the frame is a fixed 4:5 box; the intrinsic
 * dimensions from the database are still passed through in metadata and
 * JSON-LD.
 *
 * This component stays a *server* component. Its callers include the product
 * detail page, which is server-rendered; making the whole of it client would
 * pull `ProductVisual`'s SVG bodies into the bundle for no gain.
 */
export function ProductMedia({
  product,
  sizes,
  priority = false,
  hoverSwap = false,
}: {
  product: Product;
  /** Required when an image exists — a wrong `sizes` ships the wrong bytes. */
  sizes: string;
  /** True only for above-the-fold imagery. */
  priority?: boolean;
  /**
   * Opt in to the second-image hover cross-fade. Off by default so the PDP
   * gallery and any other single-frame use keeps exactly its current
   * behaviour — this is a grid-card affordance, not a global one.
   */
  hoverSwap?: boolean;
}) {
  const image = product.images[0];
  const fallback = <ProductVisual variant={product.visual} />;

  if (!image) return fallback;

  return (
    <ProductPhoto
      src={image.url}
      hoverSrc={hoverSwap ? product.images[1]?.url : undefined}
      alt={image.alt || describe(product)}
      sizes={sizes}
      priority={priority}
      fallback={fallback}
    />
  );
}

/**
 * Alt text of last resort: what the thing is, then what kind of thing it is.
 * Never empty and never the word "image" — a screen reader user asking about a
 * product tile wants "Seam Coat, outerwear", not "image".
 */
function describe(product: Product): string {
  return `${product.name} — ${product.category.name}`;
}

/**
 * Collection grid: 2 → 3 → 4 columns (`load-more-grid.tsx`: `grid-cols-2`,
 * `lg:grid-cols-3`, `2xl:grid-cols-4`).
 *
 * This previously opened with `(max-width: 640px) 100vw`, describing a
 * single-column mobile grid that stopped existing when the grid moved to two
 * columns. The cost was not theoretical: measured on an emulated 390px phone
 * at DPR 3, a tile rendered **163×204 CSS px** was downloading the
 * `w_1200` Cloudinary rendition at **227 KiB**, because `100vw × 3` asked for
 * ~1170px. Declaring the real 50vw drops the request to roughly a quarter of
 * the pixels. `sizes` is a promise about layout — when the layout changes,
 * this has to change with it.
 */
export const GRID_IMAGE_SIZES =
  "(max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 25vw";

/**
 * Editorial rail (`featured-products.tsx`): one column below `md`, then a
 * three-column grid where the lead piece spans two of them and the three
 * supporting pieces take one. Different layout from the grid above, so it
 * needs its own promise rather than borrowing that one.
 */
export const FEATURED_LEAD_IMAGE_SIZES =
  "(max-width: 767px) 100vw, 62vw";

export const FEATURED_SIDE_IMAGE_SIZES =
  "(max-width: 767px) 100vw, 31vw";

/** Detail page: full width on mobile, seven of twelve columns on desktop. */
export const DETAIL_IMAGE_SIZES = "(max-width: 1024px) 100vw, 58vw";
