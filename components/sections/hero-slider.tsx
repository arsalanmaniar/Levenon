import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";
import { findHeroCampaignAsset } from "@/lib/server/hero-assets";

/**
 * Full-bleed, Maria B–style hero (client brief, 2026-08-31, twenty-first
 * pass) — the fourth hero rebuild in six passes, and the first one that
 * actually gets full-bleed campaign photography onto every slide.
 *
 * **Where the five images came from.** The brief's Step 1 asked for
 * Hugging Face MCP image generation first. Checked before writing a line of
 * component code: `.mcp.json` declares only the `21st` server, and
 * `ToolSearch`/`ListMcpResourcesTool` both confirm no Hugging Face tool
 * exists in this session — same result as the previous pass, reconfirmed
 * rather than assumed stale. Per the brief's own Attempt C, downloaded the
 * five named real catalogue photographs from Cloudinary straight to
 * `public/images/hero/` (`node:fs` + `fetch`, then discarded the script) so
 * `hero-assets.ts`'s existing file-existence check picks them up with zero
 * new code: `monsoon-blooms`, `adda-work-chiffon`, `sequence-net-suit`,
 * `handwork-silk-suit` (the brief's own four), plus `scifflie-lawn-suit` for
 * the fifth "brand story" slide the brief left as "best available."
 *
 * **This drops the previous three passes' "bounded panel with the full
 * garment visible" design entirely** — not an oversight, the brief's whole
 * premise this time (`object-cover`, full-bleed, Maria B) supersedes it.
 * These are still portrait ecommerce photographs, not landscape campaign
 * shoots, so `object-cover` on a 90vh frame crops them — expected, and the
 * reason the brief itself named this path "Attempt C," behind real AI
 * generation. Disclosed in the pass log, not hidden.
 */
const SLIDE_COPY: Array<{
  label: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  alt: string;
  badge?: string;
  countdown?: boolean;
}> = [
  {
    label: "New Collection",
    headline: "Edit 01",
    subtext: "Unstitched. Yours to finish.",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
    alt: "Monsoon Blooms Chikankari — new collection",
  },
  {
    label: "Hand Embroidery",
    headline: "Worked By Hand",
    subtext: "Chikankari. Adda work. Yours to stitch.",
    ctaLabel: "Explore",
    ctaHref: "/collections",
    alt: "Adda Work Chiffon Suit — hand embroidery detail",
  },
  {
    label: "Limited Time Offer",
    headline: "Eid Collection",
    subtext: "Free delivery on orders above PKR 5,000.",
    ctaLabel: "Shop Eid",
    ctaHref: "/shop?category=chiffon",
    alt: "Sequence Net Suit — Eid collection",
    badge: "Free Delivery",
  },
  {
    label: "Just Arrived",
    headline: "Festive Edit",
    subtext: "48 pieces across 6 fabrics. Shop now.",
    ctaLabel: "New In",
    ctaHref: "/new-in",
    alt: "Handwork Silk Suit — festive edit",
    countdown: true,
  },
  {
    label: "The Atelier",
    headline: "The Cloth, Before The Cut",
    subtext: "Hand-selected fabrics. Yours to finish.",
    ctaLabel: "Our Story",
    ctaHref: "/atelier",
    alt: "Scifflie Lawn Suit — the atelier",
  },
];

/**
 * "Static display... showing urgency" (client brief) — computed once, on
 * the server, per request. Deliberately not a client-side ticking timer:
 * the brief's own words are "static display," and a number that changes on
 * every render would also be a hydration mismatch waiting to happen.
 */
function daysUntilEndOfMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diffMs = endOfMonth.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export async function HeroSlider() {
  const countdownDays = daysUntilEndOfMonth();

  const slides: HeroSlide[] = SLIDE_COPY.map((copy, index) => ({
    label: copy.label,
    headline: copy.headline,
    subtext: copy.subtext,
    ctaLabel: copy.ctaLabel,
    ctaHref: copy.ctaHref,
    imageAlt: copy.alt,
    badge: copy.badge,
    countdownDays: copy.countdown ? countdownDays : undefined,
    campaign: findHeroCampaignAsset(index + 1),
  }));

  return <HeroSliderClient slides={slides} />;
}
