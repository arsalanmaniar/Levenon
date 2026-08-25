import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { listCategories, listProducts } from "@/lib/server/products";

/**
 * "Explore by Fabric" (client brief, 2026-08-27) — a horizontal-scroll strip
 * of category cards, between Top Selling and the full collection grid.
 *
 * Each card counts and links exactly the way `/collections` already does
 * (`/shop?category=<slug>`, the grid's own filter param) — this is a second,
 * more compact entry point to the same real filtering, not a new one.
 */
export async function FabricExplorer() {
  const [categories, catalogue] = await Promise.all([listCategories(), listProducts()]);

  const cards = categories.map((category) => {
    const inCategory = catalogue.filter((product) => product.category.slug === category.slug);
    return {
      category,
      count: inCategory.length,
      image: inCategory.find((product) => product.images[0])?.images[0],
    };
  });

  if (cards.length === 0) return null;

  return (
    <section className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 pb-20 pt-4 md:px-12 md:pb-28 md:pt-6 lg:px-20">
        <Reveal>
          <div className="border-b border-hairline pb-6">
            <p className="label text-charcoal">Explore by Fabric</p>
            <h2 className="mt-4 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
              Find your fabric.
            </h2>
          </div>
        </Reveal>

        {/* Horizontal scroll strip, snap-x — 1.5 cards visible on mobile as
            a hint there's more (client brief), the full six from `lg` up
            (200px × 6 + gaps comfortably fits the 1400px shell). */}
        <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map(({ category, count, image }, index) => (
            <Reveal
              as="li"
              key={category.id}
              delay={index * 0.05}
              className="w-[66.6667vw] shrink-0 snap-start sm:w-[200px]"
            >
              <Link
                href={`/shop?category=${category.slug}`}
                className="group relative block h-[280px] w-full overflow-hidden border border-hairline bg-paper"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 200px, 66vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                  />
                ) : null}

                {/* ink/70 → ink/40 on hover, per the brief. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent transition-colors duration-300 ease-state group-hover:from-ink/40"
                />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-[clamp(1.125rem,2.5vw,1.375rem)] font-bold text-paper">
                    {category.name}
                  </p>
                  <p className="mt-1 font-mono text-[clamp(0.6875rem,1vw,0.8125rem)] text-purple-300">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </p>
                  <span
                    aria-hidden="true"
                    className="mt-3 inline-flex translate-y-2 items-center gap-1.5 text-[clamp(0.75rem,1vw,0.875rem)] text-paper opacity-0 transition-all duration-200 ease-state group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    Shop →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
