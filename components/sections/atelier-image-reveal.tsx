"use client";

import { useEffect, useRef, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// Same brand entrance easing as `Reveal` (expo-out) — kept as a literal copy
// rather than a shared import, since this is the one place a `clipPath`
// transform uses it instead of opacity/y.
const EASE = [0.16, 1, 0.3, 1] as const;

const HIDDEN = { clipPath: "inset(100% 0 0 0)" };
const SHOWN = { clipPath: "inset(0% 0 0 0)" };

/**
 * Atelier textile detail — replaces the R3F sculpture (client brief,
 * 2026-08-24). Clips in from the bottom on scroll-into-view, once, via
 * Framer Motion's own `whileInView` (client brief, 2026-08-25: no raw
 * `IntersectionObserver` — this file never used one directly, but the
 * `getBoundingClientRect` pre-check below decides *whether* to arm
 * `whileInView` at all, which is what actually avoids the hydration flash
 * `Reveal` documents; the trigger itself has always been `whileInView`).
 *
 * Also carries the section's scroll parallax (0.6× scroll speed) and the
 * hover Ken-Burns-style reveal, both client brief, 2026-08-25.
 */
export function AtelierImageReveal({ src, alt }: { src: string; alt: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<"plain" | "onScroll">("plain");
  const probeRef = useRef<HTMLDivElement>(null);
  // Element-relative progress (0 as the section enters the viewport from the
  // bottom, 1 as it leaves the top), not raw page `scrollY` — this section
  // sits arbitrarily far down the page, so a plain scrollY multiplier would
  // translate the image by thousands of pixels well before the container
  // itself has moved that far, flinging it out of frame. `[-40, 40]` is the
  // bounded "0.6× the scroll speed" read as a fraction of the section's own
  // travel through the viewport, not a literal 0.6 × pixel-for-pixel figure.
  const { scrollYProgress } = useScroll({
    target: probeRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  useEffect(() => {
    if (reducedMotion) {
      setMode("plain");
      return;
    }
    const rect = probeRef.current?.getBoundingClientRect();
    const onScreen = !rect || rect.top < window.innerHeight * 0.9;
    if (onScreen) return;
    setMode("onScroll");
  }, [reducedMotion]);

  return (
    <div ref={probeRef} className="relative h-full w-full overflow-hidden">
      <m.div
        className="absolute inset-0"
        initial={mode === "onScroll" ? HIDDEN : false}
        whileInView={mode === "onScroll" ? SHOWN : undefined}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
        style={mode === "plain" ? SHOWN : undefined}
      >
        {/* Parallax layer — oversized so the vertical drift never exposes an
            edge. Hover scale lives one level deeper so the two transforms
            don't fight over the same element. */}
        <m.div
          className="absolute -inset-y-[8%] inset-x-0"
          style={reducedMotion ? undefined : { y }}
        >
          <div className="group/atelier h-full w-full">
            <div className="h-full w-full transition-transform duration-500 ease-out group-hover/atelier:scale-[1.04]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 480px, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </m.div>
        {/* Warm overlay — a gradient, purple-700 at 20% opacity at the
            bottom fading to 0% at the top (client brief, 2026-08-25). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-purple-700/20 to-transparent"
        />
      </m.div>
    </div>
  );
}
