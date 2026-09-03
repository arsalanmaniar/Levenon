"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice, type Product } from "@/lib/types";

/**
 * How far the far side of the ring is dimmed and shrunk relative to the
 * front card. Both are the brief's own numbers (2026-09-03): brightness
 * falls to 0.4 and scale to 0.8 at the very back.
 */
const MAX_DIM = 0.6;
const MAX_SHRINK = 0.2;

/**
 * One tile on the 360° ring.
 *
 * **Rewritten 2026-09-03 to fix cards overlapping / z-fighting.** The
 * previous version folded the ring's live rotation into every card's own
 * placement (`rotateY(i·step − angle) translateZ(r) rotateY(−…)`) so each
 * card stayed billboarded toward the viewer. That double `rotateY` left
 * every card's plane parallel to the screen, which is precisely the case
 * where `preserve-3d` has no depth to sort by — cards at the front and back
 * of the ring occupied overlapping screen space with nothing to separate
 * them, and the compositor picked an order arbitrarily. Replaced with the
 * conventional pattern: cards are placed once at a fixed angle and the
 * *ring* rotates, so each card genuinely faces outward and `translateZ`
 * gives the browser real depth to sort. `backface-visibility: hidden` (in
 * `globals.css`) then removes the far-side cards outright rather than
 * letting them paint through the near ones.
 *
 * The visible trade-off, stated rather than hidden: cards now turn with the
 * ring instead of always facing the reader — the front card is square-on,
 * its neighbours are angled. That is inherent to this pattern (it is what
 * gives the depth cue that fixes the overlap) and is how a physical
 * carousel reads.
 *
 * `angleDeg` is the card's *world* angle — its own placement plus the
 * ring's current rotation — so 0 means "at the front, facing the reader".
 * Depth styling is derived from it here rather than passed in pre-computed,
 * since it is purely a function of that one number.
 */
export function Carousel3DCard({
  product,
  placementDeg,
  angleDeg,
  isActive,
  onFocusCard,
  cardIndex,
  priority,
}: {
  product: Product;
  /** This card's fixed seat on the ring (`cardIndex · 360/n`). Never changes. */
  placementDeg: number;
  /** Placement plus the ring's live rotation — 0 means "at the front". Drives depth only. */
  angleDeg: number;
  isActive: boolean;
  onFocusCard: (index: number) => void;
  cardIndex: number;
  priority: boolean;
}) {
  const image = product.images[0];

  // Fold into [0, 360), then into [0, 180] — 0 is dead front, 180 is dead
  // back, and 350° is 10° from the front, not 350° from it.
  const wrapped = ((angleDeg % 360) + 360) % 360;
  const fromFront = wrapped > 180 ? 360 - wrapped : wrapped;
  const depth = fromFront / 180;

  const brightness = 1 - depth * MAX_DIM;
  const scale = 1 - depth * MAX_SHRINK;

  return (
    <div
      className="carousel-3d-card"
      // Placement only — a fixed angle around the ring. The ring's own
      // rotation lives on its parent, which is what lets `translateZ` sort.
      style={{
        transform: `rotateY(${placementDeg}deg) translateZ(var(--carousel-radius))`,
      }}
    >
      <div
        className="h-full w-full transition-[filter,transform] duration-300 ease-state"
        style={{ filter: `brightness(${brightness})`, transform: `scale(${scale})` }}
      >
        <Link
          href={`/product/${product.slug}`}
          onClick={(event) => {
            // The front card navigates normally; any other card brings
            // itself to front instead of jumping straight to its PDP.
            if (!isActive) {
              event.preventDefault();
              onFocusCard(cardIndex);
            }
          }}
          aria-label={`${product.name} — ${formatPrice(product)}`}
          className={cn(
            "group relative block h-full w-full overflow-hidden border border-transparent bg-paper transition-[border-color,box-shadow] duration-300 ease-state",
            isActive && "border-purple-500 shadow-[0_0_40px_rgba(124,42,232,0.4)]",
          )}
        >
          {image && (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              priority={priority}
              sizes="200px"
              className="object-cover"
            />
          )}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity duration-300 ease-state group-hover:opacity-100",
              isActive && "opacity-100",
            )}
          >
            <p className="line-clamp-1 font-display text-[12px] font-semibold text-paper">
              {product.name}
            </p>
            <p className="mt-0.5 font-display text-[12px] font-bold text-paper/90">
              {formatPrice(product)}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
