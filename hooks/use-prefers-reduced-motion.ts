"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Reduced-motion preference, re-evaluated live if the user changes it.
 *
 * Backed by the shared media-query store, so a page full of cards costs one
 * listener rather than one per component.
 *
 * The server value is `true` deliberately: on the first client render (and
 * during hydration) we never build an animation we would then have to tear
 * down. Motion is opt-in, not opt-out. See SKILL.md §7.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
