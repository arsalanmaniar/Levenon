import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { InstagramIcon } from "@/components/ui/social-icons";
import { listProducts } from "@/lib/server/products";
import { formatPrice, type Product } from "@/lib/types";

/**
 * "Worn & Loved" (client brief, 2026-08-29, Item 3) — UGC-style social proof
 * between Top Selling and the full collection grid, in the register Maria
 * B's own "Worn & Loved ❤️" section uses.
 *
 * The handles are fabricated — disclosed, not hidden: there is no real UGC
 * feed behind this catalogue (no Instagram integration, no customer photo
 * upload pipeline), and the brief's own examples ("@zara.pk_style") are
 * themselves placeholder-style handles, not real accounts. Each card still
 * links a *real* catalogue product, so "Shop This" never dead-ends.
 */
const HANDLES = [
  "@zara.pk_style",
  "@lahoregirl.fits",
  "@embroidery.diaries",
  "@thread.and.chai",
  "@karachi.closet",
  "@saree.to.suit",
];

export async function WornAndLoved() {
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);
  if (withPhotos.length === 0) return null;

  // Spread across the catalogue rather than the first six rows, so the
  // strip doesn't just repeat whatever New Arrivals/Top Selling already
  // showed a few sections up.
  const step = Math.max(1, Math.floor(withPhotos.length / HANDLES.length));
  const featured: Product[] = [];
  for (let i = 0; i < HANDLES.length; i++) {
    const product = withPhotos[(i * step) % withPhotos.length];
    if (product && !featured.includes(product)) featured.push(product);
  }
  for (const product of withPhotos) {
    if (featured.length >= HANDLES.length) break;
    if (!featured.includes(product)) featured.push(product);
  }

  return (
    <section className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 py-12 md:px-12 lg:px-20 md:py-20">
        <Reveal>
          <div className="border-b border-hairline pb-6 text-center">
            <h2 className="inline-flex items-center gap-2.5 font-display text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
              Worn &amp; Loved
              <Heart
                aria-hidden="true"
                className="h-6 w-6 text-purple-500"
                fill="currentColor"
                strokeWidth={0}
              />
            </h2>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal">
              Real people. Real Levenon.
            </p>
          </div>
        </Reveal>

        <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {featured.map((product, index) => (
            <Reveal
              as="li"
              key={product.id}
              delay={Math.min(index, 5) * 0.05}
              className="w-[72vw] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <div className="group relative aspect-square overflow-hidden border border-hairline bg-paper">
                <Image
                  src={product.images[0].url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 72vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />

                {/* Instagram glyph, top-right of every card. */}
                <span className="absolute right-3 top-3 h-6 w-6 drop-shadow-[0_1px_3px_rgba(11,11,13,0.4)]">
                  <InstagramIcon className="h-full w-full" />
                </span>

                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-mono text-xs text-paper">{HANDLES[index]}</p>
                  <Link
                    href={`/product/${product.slug}`}
                    className="mt-1 block truncate font-display text-sm font-bold text-paper hover:text-purple-300"
                  >
                    {product.name} — {formatPrice(product)}
                  </Link>
                </div>

                {/* "Shop This →", hover-revealed on a fine pointer; always
                    present below `sm` where the strip is touch-scrolled and
                    there is no hover to reveal it from. */}
                <Link
                  href={`/product/${product.slug}`}
                  className="label absolute right-3 top-11 inline-flex min-h-[32px] items-center gap-1 rounded-full bg-paper px-3 text-ink opacity-100 transition-opacity duration-200 ease-state sm:opacity-0 sm:group-hover:opacity-100"
                >
                  Shop This →
                </Link>
              </div>
            </Reveal>
          ))}
        </ul>

        <p className="mt-10 text-center font-mono text-xs text-charcoal">
          Tag us @levenon.pk to be featured
        </p>
      </div>
    </section>
  );
}
