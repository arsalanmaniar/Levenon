"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
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
 * 2026-08-24). Clips in from the bottom on scroll-into-view, once.
 *
 * Mirrors `Reveal`'s plain/onScroll split: anything already on screen at
 * hydration (or under reduced motion) renders fully shown, never built as an
 * animation that has to be un-clipped after the fact.
 */
export function AtelierImageReveal({ src, alt }: { src: string; alt: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<"plain" | "onScroll">("plain");
  const probeRef = useRef<HTMLDivElement>(null);

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
    <m.div
      ref={probeRef}
      className="relative h-full w-full overflow-hidden"
      initial={mode === "onScroll" ? HIDDEN : false}
      whileInView={mode === "onScroll" ? SHOWN : undefined}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, ease: EASE }}
      style={mode === "plain" ? SHOWN : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 480px, 90vw"
        className="object-cover"
      />
      {/* Warm overlay, per the brief — purple-700 at 15% opacity over the photo. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-purple-700/15" />
    </m.div>
  );
}
