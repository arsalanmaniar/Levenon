import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";
import { findHeroCampaignAsset } from "@/lib/server/hero-assets";
import { listProducts } from "@/lib/server/products";
import { formatPrice } from "@/lib/types";
import type { Product } from "@/lib/types";

/**
 * Magazine split-layout hero (client brief, 2026-09-02, eighteenth pass) —
 * the previous pass's bounded panel on a flat `bg-ink` ground read as "a
 * product photo on a plain background," not a fashion campaign. This
 * version's rule: the catalogue only has portrait product photography (no
 * landscape campaign shoots exist), so the premium read comes from
 * **layout and colour, not from stretching the photo** — a fixed 50/50
 * magazine split per slide, rich per-slide gradients (never flat ink), a
 * precise 3:4 framed portrait on the right, editorial type and decorative
 * linework on the left. See `hero-slider-client.tsx` for the full
 * treatment; this file only supplies data.
 *
 * Four specific, hand-picked products (no category/"any" fallback tree —
 * each slug is chosen for what the slide's copy is actually about and
 * hardcoded here):
 *   1. `sequence-net-suit` — sequence embroidery + adda work at the neck,
 *      the densest embroidery in the catalogue, for the generic "New
 *      Collection" opener.
 *   2. `monsoon-blooms` — literally a chikankari piece (needlework, not
 *      machine work), matching the slide's own "Chikankari and adda work"
 *      subtext exactly rather than approximately.
 *   3. `scifflie-lawn-suit` — schiffli-loom embroidery on lawn, matching
 *      "Schiffli lawn. Organza. Silk." verbatim. Unchanged from the
 *      seventeenth pass — it already was the right product.
 *   4. `handwork-silk-suit` — hand-set stones/embroidery over printed
 *      silk, the most premium fabric in the edit, for "The Atelier."
 *      Unchanged from the seventeenth pass.
 *
 * If dedicated wide campaign photography ever lands in
 * `public/images/hero/` (see that folder's README), `findHeroCampaignAsset`
 * still picks it up automatically per slide and that slide renders
 * full-bleed instead of the magazine-split treatment — this pass didn't
 * touch that architecture, only the fallback it falls back to.
 */
const SLIDE_COPY: Array<{
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  slug: string;
}> = [
  {
    eyebrow: "New Collection — Edit 01",
    headline: "Unstitched. Yours to finish.",
    subtext: "48 pieces across 6 fabrics.",
    ctaLabel: "Shop the Edit",
    ctaHref: "/shop",
    slug: "sequence-net-suit",
  },
  {
    eyebrow: "Hand Embroidery",
    headline: "Worked by hand. Cut by you.",
    subtext: "Chikankari and adda work, unstitched.",
    ctaLabel: "Explore Fabrics",
    ctaHref: "/collections",
    slug: "monsoon-blooms",
  },
  {
    eyebrow: "Fabric First",
    headline: "The cloth, before the cut.",
    subtext: "Schiffli lawn. Organza. Silk.",
    ctaLabel: "View All",
    ctaHref: "/shop",
    slug: "scifflie-lawn-suit",
  },
  {
    eyebrow: "The Atelier",
    headline: "Cut clean. Sewn to last.",
    subtext: "Tailored the moment it's yours.",
    ctaLabel: "Meet the Atelier",
    ctaHref: "/atelier",
    slug: "handwork-silk-suit",
  },
];

export async function HeroSlider() {
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);
  if (withPhotos.length === 0) return null;

  const findBySlug = (slug: string): Product =>
    withPhotos.find((product) => product.slug === slug) ?? withPhotos[0];

  const slides: HeroSlide[] = SLIDE_COPY.map((copy, index) => {
    const product = findBySlug(copy.slug);
    const image = product.images[0];

    return {
      eyebrow: copy.eyebrow,
      headline: copy.headline,
      subtext: copy.subtext,
      ctaLabel: copy.ctaLabel,
      ctaHref: copy.ctaHref,
      photo: {
        url: image.url,
        alt: image.alt || `${product.name} — ${product.category.name}`,
        width: image.width,
        height: image.height,
      },
      productName: product.name,
      price: formatPrice(product),
      campaign: findHeroCampaignAsset(index + 1),
    };
  });

  return <HeroSliderClient slides={slides} />;
}
