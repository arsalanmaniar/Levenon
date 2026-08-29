import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Optional dedicated hero campaign photography (client brief, 2026-09-01).
 *
 * Nothing ships here today — no wide 16:9/21:9 campaign asset exists
 * anywhere in this project, and this codebase has no image-generation tool
 * to produce one — but the hero is built to pick one up automatically the
 * moment a real shoot lands, with no code change required. Drop a file
 * named `slide-{n}-desktop.{jpg|jpeg|png|webp}` (and optionally
 * `slide-{n}-mobile.{...}` for a dedicated portrait crop) into
 * `public/images/hero/` — see the README there for the exact brief. Until
 * then, `hero-slider.tsx` falls back to real catalogue photography shown as
 * a bounded editorial panel rather than stretched full-bleed — see that
 * file's own doc comment.
 */
const HERO_ASSET_DIR = path.join(process.cwd(), "public", "images", "hero");
const EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

function find(basename: string): string | null {
  for (const ext of EXTENSIONS) {
    const file = `${basename}.${ext}`;
    if (existsSync(path.join(HERO_ASSET_DIR, file))) {
      return `/images/hero/${file}`;
    }
  }
  return null;
}

export type HeroCampaignAsset = { desktop: string; mobile: string | null };

/** `slideNumber` is 1-indexed, matching the README's naming convention. */
export function findHeroCampaignAsset(slideNumber: number): HeroCampaignAsset | null {
  const desktop = find(`slide-${slideNumber}-desktop`);
  if (!desktop) return null;
  return { desktop, mobile: find(`slide-${slideNumber}-mobile`) };
}
