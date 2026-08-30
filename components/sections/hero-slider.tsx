import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";

/**
 * Pure CSS/SVG editorial hero (client brief, 2026-08-31, twenty-second pass)
 * — the fifth hero rebuild in eight passes, and the first with no
 * photography dependency of any kind. `public/images/hero/` is deleted;
 * `lib/server/hero-assets.ts` is kept but permanently inert (see its own
 * doc comment). No product catalogue read either — nothing here needs a
 * product name, price, or photo any more, so this file is now pure static
 * copy, not a server fetch. Kept as a (non-async) Server Component anyway,
 * matching every other section's "data here, presentation in the client
 * component" split, in case a future pass wants to read real data again
 * without restructuring the seam.
 *
 * Five slides, each a bespoke CSS/SVG composition — see
 * `hero-slider-client.tsx` for the five `Visual*` components and exactly
 * which shapes/animations belong to which slide.
 */
const SLIDES: HeroSlide[] = [
  {
    label: "New Collection",
    headline: ["Unstitched.", "Yours to finish."],
    subtext: "48 pieces. 6 fabrics.",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
  },
  {
    label: "Hand Embroidery",
    headline: ["Worked by hand.", "Cut by you."],
    subtext: "Chikankari. Adda work.",
    ctaLabel: "Explore",
    ctaHref: "/collections",
  },
  {
    label: "Eid Collection",
    headline: ["Dressed for", "the occasion."],
    subtext: "Free delivery on orders above PKR 5,000.",
    ctaLabel: "Shop Eid",
    ctaHref: "/shop?category=chiffon",
    badge: "Free Delivery Above PKR 5,000",
  },
  {
    label: "Fabric First",
    headline: ["The cloth,", "before the cut."],
    subtext: "6 fabrics. Each chosen by hand.",
    ctaLabel: "View Fabrics",
    ctaHref: "/fabrics",
  },
  {
    // The brief gave this slide's *visual* (giant "L", the ring motif,
    // "Est. 2024") but no label/headline/subtext/CTA copy, unlike slides
    // 1–4. Rather than invent new marketing lines, this reuses copy already
    // established and vetted in this project's own history: the headline is
    // SKILL.md §9's own example voice (already used verbatim for an
    // earlier "Atelier" hero slide), and the subtext is that same earlier
    // slide's line.
    label: "The Atelier",
    headline: ["Cut clean.", "Sewn to last."],
    subtext: "Tailored the moment it's yours.",
    ctaLabel: "Our Story",
    ctaHref: "/atelier",
    light: true,
  },
];

export function HeroSlider() {
  return <HeroSliderClient slides={SLIDES} />;
}
