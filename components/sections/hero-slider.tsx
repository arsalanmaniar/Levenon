import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";
import { findHeroCampaignAsset } from "@/lib/server/hero-assets";
import { listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

/**
 * Full-bleed hero, fresh rewrite (client brief, 2026-08-30, nineteenth pass)
 * — the eighteenth pass's two-column magazine split (separate left/right
 * gradients, framed 3:4 photo, word-by-word headline) is scrapped entirely
 * per this brief's own explicit instruction, in favour of one simple,
 * "guaranteed to work" full-bleed slide: a single gradient behind the whole
 * frame, text left, a bottom-aligned product photo right, plain crossfade +
 * fade-up motion. See `hero-slider-client.tsx` for the rebuilt component;
 * this file only supplies data.
 *
 * **Two of the brief's four literal slugs don't exist in the catalogue** —
 * `adda-work-chiffon-suit` and `monsoon-blooms-chikankari` are not real
 * rows; the real ones are `adda-work-chiffon` and `monsoon-blooms` (the
 * same two products both the seventeenth and eighteenth passes already used
 * for this exact "New Collection" / "Hand Embroidery" pairing). Corrected
 * to the real slugs rather than silently building a fuzzy-match resolver —
 * disclosed here and in the pass log, not guessed quietly. The other two
 * (`sequence-net-suit`, `handwork-silk-suit`) match real rows exactly.
 */
const SLIDE_COPY: Array<{
  eyebrow: string;
  headlineLines: [string, string];
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  slug: string;
}> = [
  {
    eyebrow: "New Collection — Edit 01",
    headlineLines: ["Unstitched.", "Yours to finish."],
    subtext: "48 pieces across 6 fabrics.",
    ctaLabel: "Shop the Edit",
    ctaHref: "/shop",
    slug: "adda-work-chiffon",
  },
  {
    eyebrow: "Hand Embroidery",
    headlineLines: ["Worked by hand.", "Cut by you."],
    subtext: "Chikankari, worked stitch by stitch.",
    ctaLabel: "Explore Fabrics",
    ctaHref: "/collections",
    slug: "monsoon-blooms",
  },
  {
    eyebrow: "Festive Collection",
    headlineLines: ["Dressed for", "the occasion."],
    subtext: "Sequence net and organza, unstitched.",
    ctaLabel: "View All",
    ctaHref: "/shop",
    slug: "sequence-net-suit",
  },
  {
    eyebrow: "The Atelier",
    headlineLines: ["The cloth,", "before the cut."],
    subtext: "Hand embroidery on pure silk.",
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
      headlineLines: copy.headlineLines,
      subtext: copy.subtext,
      ctaLabel: copy.ctaLabel,
      ctaHref: copy.ctaHref,
      photo: {
        url: image.url,
        alt: image.alt || `${product.name} — ${product.category.name}`,
        width: image.width,
        height: image.height,
      },
      campaign: findHeroCampaignAsset(index + 1),
    };
  });

  return <HeroSliderClient slides={slides} />;
}
