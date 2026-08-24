"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

/**
 * One product photograph, with a guaranteed fallback.
 *
 * A CDN URL can rot — a Cloudinary asset gets deleted, a marketplace starts
 * refusing hotlinks, a version string goes stale. When that happens the
 * customer must never see a broken-image icon, so `onError` swaps in the
 * brand's line art instead. That is the *only* reason this file is a client
 * component: `onError` is a DOM event and cannot run on the server.
 *
 * The fallback arrives as an already-rendered element from the server, not as
 * a variant name. Rendering `ProductVisual` in here would drag its four SVG
 * bodies into the client bundle for a branch that almost never runs; passing
 * the element keeps that markup on the server where it belongs.
 */
export function ProductPhoto({
  src,
  hoverSrc,
  alt,
  sizes,
  priority,
  fallback,
}: {
  src: string;
  /**
   * Second photograph, cross-faded in on hover. Optional — many rows have
   * only one usable image, and a card with nothing to swap to simply
   * doesn't swap rather than faking it by re-showing the same frame.
   */
  hoverSrc?: string;
  alt: string;
  sizes: string;
  priority: boolean;
  /** Server-rendered line art, shown if the image fails to load. */
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  // Tracked separately: the second image failing must not take down the
  // first one, which is almost certainly fine — it just cancels the swap.
  const [hoverFailed, setHoverFailed] = useState(false);
  /*
   * The hover frame is not requested until the pointer first arrives.
   *
   * Rendering it upfront (even lazily) doubled the image count on `/` from
   * 16 to 32, and measured against a production build that was enough to
   * leave 14 of them permanently queued — the blank-tile bug. Deferring to
   * real intent means a default page load costs exactly what it did before
   * the hover swap existed, while a browsing visitor still gets the second
   * frame. `onPointerEnter` fires well before the CSS opacity transition
   * finishes, so in practice the image is decoded by the time it is needed.
   *
   * Once armed it stays mounted — re-requesting on every enter/leave would
   * be worse than keeping one decoded frame around.
   */
  const [armed, setArmed] = useState(false);
  /*
   * The primary frame must not start fading until the frame underneath is
   * actually painted, or the first hover shows the empty card through the
   * gap while the second image is still in flight. Gating the fade on a
   * real `onLoad` means the very first hover simply does nothing visible
   * (for the few hundred ms the fetch takes) instead of flashing a hole.
   */
  const [hoverReady, setHoverReady] = useState(false);

  if (failed) return <>{fallback}</>;

  const showHover = hoverSrc && !hoverFailed;
  const fadeOnHover = showHover && armed && hoverReady;

  return (
    <span
      // `contents` so this wrapper introduces no box of its own — the two
      // images keep filling the positioned parent exactly as before.
      className="contents"
      onPointerEnter={showHover ? () => setArmed(true) : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        // Above-the-fold images must not be lazy; everything else should be.
        loading={priority ? undefined : "lazy"}
        onError={() => setFailed(true)}
        className={
          fadeOnHover
            ? "object-cover transition-opacity duration-500 ease-enter group-hover:opacity-0 motion-reduce:transition-none"
            : "object-cover"
        }
      />
      {showHover && armed && (
        /*
          The second frame sits underneath and is revealed by the first
          fading out, rather than fading in over the top — one animated
          property instead of two, and no moment where both are partly
          transparent and the card background shows through between them.
          Always lazy regardless of `priority`: it is never the LCP
          candidate.
        */
        <Image
          src={hoverSrc}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          loading="lazy"
          onLoad={() => setHoverReady(true)}
          onError={() => setHoverFailed(true)}
          className="-z-10 object-cover"
        />
      )}
    </span>
  );
}
