/**
 * Scroll lock for modal surfaces (currently just the cart drawer).
 *
 * Lenis drives scrolling when motion is allowed, so `overflow: hidden` alone is
 * not enough — Lenis keeps writing scroll positions. The smooth-scroll provider
 * registers its instance here on creation so a modal can stop and restart it;
 * when Lenis is absent (reduced motion, or before it loads) the CSS lock is the
 * whole mechanism.
 */

type LenisLike = { stop: () => void; start: () => void };

let lenis: LenisLike | null = null;

export function registerLenis(instance: LenisLike | null) {
  lenis = instance;
}

export function lockScroll() {
  lenis?.stop();
  if (typeof document !== "undefined") {
    document.documentElement.style.overflow = "hidden";
  }
}

export function unlockScroll() {
  if (typeof document !== "undefined") {
    document.documentElement.style.overflow = "";
  }
  lenis?.start();
}
