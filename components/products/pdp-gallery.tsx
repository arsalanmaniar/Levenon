"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { ProductImage } from "@/lib/types";

/**
 * The PDP's image gallery: one large primary frame, a thumbnail strip below
 * it when there is more than one photograph. Clicking a thumbnail crossfades
 * the primary image rather than hard-cutting — the one Framer Motion touch
 * this component needs.
 *
 * A single-image (or zero-image) product renders exactly what the old PDP
 * did: one large frame, no thumbnail row, no empty gallery chrome standing
 * in for photography that doesn't exist.
 */
export function PdpGallery({
  images,
  productName,
  sku,
  fallback,
}: {
  images: ProductImage[];
  productName: string;
  sku: string;
  /** Server-rendered line art, shown when a photo is missing or fails. */
  fallback: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const reducedMotion = usePrefersReducedMotion();

  const current = images[active];
  const showFallback = !current || failedIndexes.has(active);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden border border-hairline bg-paper">
        <AnimatePresence mode="wait" initial={false}>
          {showFallback ? (
            <m.div
              key="fallback"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? {} : { opacity: 1 }}
              exit={reducedMotion ? {} : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3 }}
              className="absolute inset-0"
            >
              {fallback}
            </m.div>
          ) : (
            <m.div
              key={active}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? {} : { opacity: 1 }}
              exit={reducedMotion ? {} : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={current.alt || productName}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority={active === 0}
                onError={() =>
                  setFailedIndexes((prev) => new Set(prev).add(active))
                }
                className="object-cover"
              />
            </m.div>
          )}
        </AnimatePresence>

        <span className="label absolute right-5 top-5 rounded-full border border-hairline bg-paper/85 px-2.5 py-1 text-charcoal backdrop-blur-[2px]">
          {sku}
        </span>
      </div>

      {images.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-3" aria-label="More views">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                aria-current={index === active ? "true" : undefined}
                aria-label={`View ${index + 1} of ${images.length}`}
                onClick={() => setActive(index)}
                className={cn(
                  "relative h-20 w-16 overflow-hidden border transition-colors duration-200 ease-state",
                  index === active
                    ? "border-purple-500"
                    : "border-hairline hover:border-purple-500/50",
                )}
              >
                {failedIndexes.has(index) ? (
                  <span className="absolute inset-0 bg-hairline/40" />
                ) : (
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() =>
                      setFailedIndexes((prev) => new Set(prev).add(index))
                    }
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
