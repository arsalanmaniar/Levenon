import { HeroSliderClient, type HeroSlide } from "./hero-slider-client";
import { listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

/**
 * Cinematic auto-playing hero (client brief, 2026-08-30, Item 1) — replaces
 * the previous pass's static hero + product collage entirely, per the
 * brief's own explicit "remove the old static hero" instruction. Copy is
 * the brief's own literal text for all three slides; only the background
 * photograph per slide is this component's own choice.
 *
 * Three named, hand-picked products rather than a computed "best
 * photography" heuristic (the catalogue has no such field): Tussel Organza
 * Suit for the generic opener (a striking, distinct silhouette — hanging
 * tussels, cutwork, kiran lace — for visual variety against the other two),
 * Adda Work Chiffon Suit for "Hand Embroidery" (its own embroidery
 * technique literally is adda work), and Scifflie Lawn Suit for "Fabric
 * First" (its own embroidery technique literally is schiffli, which the
 * slide's own copy names). Each falls back to the first photographed
 * product in a different category if its named slug is ever retired, so
 * the slider still renders three real, distinct images regardless.
 */
export async function HeroSlider() {
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);
  if (withPhotos.length === 0) return null;

  const used = new Set<string>();
  const pick = (slug: string, categorySlug: string): Product => {
    const named = withPhotos.find((product) => product.slug === slug);
    if (named) {
      used.add(named.id);
      return named;
    }
    const byCategory = withPhotos.find(
      (product) => product.category.slug === categorySlug && !used.has(product.id),
    );
    const fallback =
      byCategory ?? withPhotos.find((product) => !used.has(product.id)) ?? withPhotos[0];
    used.add(fallback.id);
    return fallback;
  };

  const organza = pick("tussel-organza-suit", "organza");
  const chiffon = pick("adda-work-chiffon", "chiffon");
  const lawn = pick("scifflie-lawn-suit", "lawn");

  const slides: HeroSlide[] = [
    {
      imageUrl: organza.images[0].url,
      imageAlt: "",
      eyebrow: "New Collection — Edit 01",
      headline: "Unstitched. Yours to finish.",
      subtext: "48 pieces across 6 fabrics.",
      ctaLabel: "Shop the Edit",
      ctaHref: "/shop",
    },
    {
      imageUrl: chiffon.images[0].url,
      imageAlt: "",
      eyebrow: "Hand Embroidery",
      headline: "Worked by hand. Cut by you.",
      subtext: "Chikankari and adda work, unstitched.",
      ctaLabel: "Explore Fabrics",
      ctaHref: "/collections",
    },
    {
      imageUrl: lawn.images[0].url,
      imageAlt: "",
      eyebrow: "Fabric First",
      headline: "The cloth, before the cut.",
      subtext: "Schiffli lawn. Organza. Silk.",
      ctaLabel: "View All",
      ctaHref: "/shop",
    },
  ];

  return <HeroSliderClient slides={slides} />;
}
