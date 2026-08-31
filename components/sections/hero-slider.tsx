import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";

/**
 * Hero, right side back to real photography on slides 1–4 (client brief,
 * 2026-08-31, twenty-third pass) — the CSS/SVG editorial art from the
 * previous pass stays as the fallback (see `hero-slider-client.tsx`'s
 * `SlideRightPanel`: a slide with no `photo` field still renders its
 * `Visual*` component), but every slide that has one now shows a real
 * garment photo instead. `public/images/hero/` stays deleted and
 * `lib/server/hero-assets.ts` stays inert — these four URLs are read
 * straight from `catalogue-data.ts`'s already-live Cloudinary rows, not a
 * locally-hosted asset, so neither of those has anything to do with this
 * pass. No `listProducts()` call either: four fixed, versioned Cloudinary
 * URLs don't need the whole catalogue re-read on every request just to
 * find them again — copied here directly, with their real `alt`/`width`/
 * `height` preserved from the catalogue row they came from.
 *
 * **Slide 5 is deliberately untouched.** The brief named four products for
 * four slides; slide 5 ("The Atelier" — the brand/wordmark slide, the
 * project's one paper-background slide) wasn't one of them, and a garment
 * photo doesn't fit what that slide is actually about. It keeps its CSS
 * art (`Visual5`).
 */
const SLIDES: HeroSlide[] = [
  {
    label: "New Collection",
    headline: ["Unstitched.", "Yours to finish."],
    subtext: "48 pieces. 6 fabrics.",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
    // Adda Work Chiffon Suit — images[0], catalogue-data.ts:212
    photo: {
      url: "https://res.cloudinary.com/dhyz3jzmy/image/upload/v1755956303/Products/483/image/media_1755956018371_1755956302811.jpg",
      alt: "Adda Work Chiffon Suit — Chiffon",
      width: 800,
      height: 1200,
    },
  },
  {
    label: "Hand Embroidery",
    headline: ["Worked by hand.", "Cut by you."],
    subtext: "Chikankari. Adda work.",
    ctaLabel: "Explore",
    ctaHref: "/collections",
    // Monsoon Blooms Chikankari — images[0], catalogue-data.ts:276
    photo: {
      url: "https://res.cloudinary.com/dhyz3jzmy/image/upload/v1756313373/Products/648/image/media_1756313349406_1756313372888.jpg",
      alt: "Monsoon Blooms Chikankari — Cotton",
      width: 1080,
      height: 1080,
    },
  },
  {
    label: "Eid Collection",
    headline: ["Dressed for", "the occasion."],
    subtext: "Free delivery on orders above PKR 5,000.",
    ctaLabel: "Shop Eid",
    ctaHref: "/shop?category=chiffon",
    badge: "Free Delivery Above PKR 5,000",
    // Sequence Net Suit — images[0], catalogue-data.ts:372
    photo: {
      url: "https://res.cloudinary.com/dhyz3jzmy/image/upload/v1759313841/Products/1058/image/media_1759313468504_1759313841024.jpg",
      alt: "Sequence Net Suit — Net",
      width: 853,
      height: 1280,
    },
  },
  {
    label: "Fabric First",
    headline: ["The cloth,", "before the cut."],
    subtext: "6 fabrics. Each chosen by hand.",
    ctaLabel: "View Fabrics",
    ctaHref: "/fabrics",
    // Tussel Organza Suit — images[0], catalogue-data.ts:404
    photo: {
      url: "https://res.cloudinary.com/dhyz3jzmy/image/upload/v1756055014/Products/550/image/media_1756054963290_1756055014566.jpg",
      alt: "Tussel Organza Suit — Organza",
      width: 853,
      height: 1280,
    },
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
