import "server-only";

/**
 * Hero campaign photography — deliberately inert (client brief, 2026-08-31).
 *
 * The hero is pure CSS/SVG editorial art now, with no photography of any
 * kind (see `hero-slider-client.tsx`) — `public/images/hero/` has been
 * deleted, and nothing calls this function any more. Kept, rather than
 * deleted outright, only so a future pass that wants to reintroduce real
 * campaign photography doesn't have to re-derive this file-existence
 * convention from scratch: restore the `node:fs` lookup this used to do
 * (see this project's git history on this file) and wire `hero-slider.tsx`
 * back up to call it. Until then it always returns `null` — no filesystem
 * check needed, because there is nothing left to check for.
 */
export type HeroCampaignAsset = { desktop: string; mobile: string | null };

/** `slideNumber` is 1-indexed. Always `null` — see the doc comment above. */
export function findHeroCampaignAsset(_slideNumber: number): HeroCampaignAsset | null {
  return null;
}
