import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { Reveal } from "@/components/ui/reveal";
import { listCategories, listProducts } from "@/lib/server/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse the Levenon edit by fabric — Lawn, Cotton, Chiffon, Silk, Organza, Net.",
  alternates: { canonical: "/collections" },
};

/**
 * Category browse (client brief, 2026-08-26) — one card per fabric, each
 * linking to `/shop?category=<slug>`, which is the real `ProductGrid`
 * pre-filtered via its existing query-param filter (no new filtering logic).
 */
export default async function CollectionsPage() {
  const categories = await listCategories();
  const catalogue = await listProducts();

  const cards = categories.map((category) => ({
    category,
    // One representative photo per category — the first product in it with
    // real photography, falling back to no image (the card still works,
    // just without the background photo) rather than the SVG line-art,
    // which would look like a placeholder rather than a considered choice.
    image: catalogue.find(
      (product) => product.category.slug === category.slug && product.images[0],
    )?.images[0],
  }));

  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-shell px-6 py-16 md:px-12 lg:px-20 md:py-24">
          <p className="label text-charcoal">The edit, by fabric</p>
          <h1 className="mt-5 max-w-[20ch] text-balance font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Collections
          </h1>
          <p className="mt-6 max-w-measure text-lg leading-relaxed text-charcoal">
            Six cloths, cut in small runs. Pick one to see everything on the
            rail in it.
          </p>

          <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ category, image }, index) => (
              <Reveal as="li" key={category.id} delay={index * 0.06}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden border border-hairline bg-paper transition-colors duration-300 ease-state hover:border-purple-500/40"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                  {/* Legibility scrim over the photo — the name has to read
                      regardless of what's underneath it. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="label text-paper/70">
                      {category.tagline ?? "Levenon"}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-paper">
                      {category.name}
                    </h2>
                    <span className="label mt-3 inline-flex items-center gap-2 text-paper/80 transition-colors duration-200 ease-state group-hover:text-purple-300">
                      Shop {category.name}
                      <span aria-hidden="true" className="transition-transform duration-200 ease-state group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
