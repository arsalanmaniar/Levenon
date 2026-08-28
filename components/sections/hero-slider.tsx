import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";

/**
 * Cinematic auto-playing hero (client brief, 2026-08-30, Item 1; backgrounds
 * replaced 2026-08-31). Copy is unchanged from the previous pass — only the
 * background per slide changed, from a product photograph to an editorial
 * CSS/SVG composition (see `hero-slide-art.tsx`): the catalogue's
 * photography is portrait/square, the wrong aspect for a landscape hero, and
 * "do not use product images as hero backgrounds" is this pass's own
 * explicit instruction.
 *
 * No longer async and no longer reads the catalogue — the slider carries no
 * product-specific data anymore, so there is nothing here to fetch. Kept as
 * its own file regardless, matching the "server component wraps client
 * component" split every other section on this site uses, in case a future
 * pass reintroduces catalogue-driven copy.
 */
const SLIDES: HeroSlide[] = [
  {
    variant: "thread",
    textTone: "paper",
    eyebrow: "New Collection — Edit 01",
    headline: "Unstitched. Yours to finish.",
    subtext: "48 pieces across 6 fabrics.",
    ctaLabel: "Shop the Edit",
    ctaHref: "/shop",
  },
  {
    variant: "fabric",
    textTone: "paper",
    eyebrow: "Hand Embroidery",
    headline: "Worked by hand. Cut by you.",
    subtext: "Chikankari and adda work, unstitched.",
    ctaLabel: "Explore Fabrics",
    ctaHref: "/collections",
  },
  {
    variant: "edit",
    textTone: "ink",
    eyebrow: "Fabric First",
    headline: "The cloth, before the cut.",
    subtext: "Schiffli lawn. Organza. Silk.",
    ctaLabel: "View All",
    ctaHref: "/shop",
  },
];

export function HeroSlider() {
  return <HeroSliderClient slides={SLIDES} />;
}
