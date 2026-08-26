import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

type Panel = {
  categorySlugs: string[];
  label: string;
  sublabel: string;
  ctaLabel: string;
  href: string;
};

const PANELS: Panel[] = [
  {
    categorySlugs: ["lawn"],
    label: "Lawn",
    sublabel: "Airy. Printed. Everyday.",
    ctaLabel: "Shop Lawn",
    href: "/shop?category=lawn",
  },
  {
    categorySlugs: ["chiffon", "silk"],
    label: "Chiffon & Silk",
    sublabel: "Fluid. Festive. Refined.",
    ctaLabel: "Shop Formal",
    href: "/shop?category=chiffon",
  },
  {
    categorySlugs: ["organza", "net"],
    label: "Organza & Net",
    sublabel: "Embellished. Occasion.",
    ctaLabel: "Shop Luxury",
    href: "/shop?category=organza",
  },
];

/**
 * "Three Ways to Wear" panels (client brief, 2026-08-30, Item 3) — Nishat
 * Linen's own convention. Between New Arrivals and Fabric Explorer.
 *
 * Each panel's photograph is the first photographed product in its target
 * categories that the hero slider (`hero-slider.tsx`) didn't already use —
 * a lighter-weight version of that component's own hand-curation: worth
 * naming three specific slugs for three full-bleed hero frames, not worth
 * repeating for three much smaller panels, but still worth avoiding an
 * immediate repeat of a photo the reader saw two sections up.
 */
export async function CategoryBanners() {
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);
  if (withPhotos.length === 0) return null;

  // Mirrors hero-slider.tsx's own three picks, so this section's images
  // don't repeat them.
  const heroSlugs = new Set(["tussel-organza-suit", "adda-work-chiffon", "scifflie-lawn-suit"]);

  const used = new Set<string>();
  const panels = PANELS.map((panel) => {
    const inCategory = withPhotos.filter((product) =>
      panel.categorySlugs.includes(product.category.slug),
    );
    const image: Product | undefined =
      inCategory.find((product) => !heroSlugs.has(product.slug) && !used.has(product.id)) ??
      inCategory.find((product) => !used.has(product.id)) ??
      inCategory[0];
    if (image) used.add(image.id);
    return { ...panel, product: image };
  }).filter((panel): panel is Panel & { product: Product } => Boolean(panel.product));

  if (panels.length === 0) return null;

  return (
    <section className="border-t border-hairline">
      <ul className="grid grid-cols-1 lg:grid-cols-3">
        {panels.map(({ product, label, sublabel, ctaLabel, href }, index) => (
          <Reveal as="li" key={label} delay={index * 0.08}>
            <Link
              href={href}
              className="group relative block h-[280px] overflow-hidden md:h-[420px]"
            >
              <Image
                src={product.images[0].url}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />

              {/* ink/40% resting, ink/20% on hover — the image itself reads
                  more clearly the moment a reader's attention is on this
                  panel, same logic as the photo's own zoom. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-ink/40 transition-colors duration-300 ease-state group-hover:bg-ink/20"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="font-display text-[22px] font-bold tracking-[-0.02em] text-paper">
                  {label}
                </p>
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/70">
                  {sublabel}
                </p>
                <span className="relative mt-4 inline-flex translate-y-2 items-center font-mono text-xs uppercase tracking-[0.1em] text-paper opacity-0 transition-all duration-300 ease-state group-hover:translate-y-0 group-hover:opacity-100">
                  {ctaLabel}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-paper transition-transform duration-300 ease-enter group-hover:scale-x-100"
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
