import { ThreadButton } from "@/components/ui/thread-button";
import { Reveal } from "@/components/ui/reveal";
import { StitchDivider } from "@/components/ui/stitch-divider";
import { AtelierCollage } from "@/components/sections/atelier-collage";
import { getCollectionSummary, listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

const COLLAGE_SIZE = 7;
// Already the hero slider's own three picks (`hero-slider.tsx`) — excluded
// here so the atelier's fan doesn't repeat a photo the reader saw a few
// sections up.
const HERO_SLUGS = new Set(["tussel-organza-suit", "adda-work-chiffon", "scifflie-lawn-suit"]);

/**
 * The single dark section on the page — the rhythm beat (SKILL.md §6).
 *
 * Roles invert: ink ground, paper type, purple-300 thread. Left side
 * (client brief, 2026-08-31): a fanned stack of seven real photographs —
 * was one large editorial image (2026-08-29), before that a decorative "01"
 * numeral + three fabric swatches (2026-08-27). Right side text/stats/CTA
 * has been untouched since the first of those passes.
 */
export async function SignatureSection() {
  const { pieceCount } = await getCollectionSummary();
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);

  // Monsoon Blooms Chikankari leads (the front, framed, captioned tile) for
  // the same reason it did as the previous pass's single image: this
  // catalogue's own chikankari piece, and the caption is close to its own
  // blurb rather than a generic line paired with an arbitrary photo. The
  // other six are the next distinct, not-already-used-by-the-hero pieces —
  // "distinct" meaning one per category where the catalogue allows it, so
  // the fan reads as a spread of the collection rather than six variations
  // on one fabric.
  const lead = withPhotos.find((product) => product.slug === "monsoon-blooms");
  const seen = new Set<string>(lead ? [lead.id] : []);
  const rest: Product[] = [];
  for (const product of withPhotos) {
    if (rest.length >= COLLAGE_SIZE - 1) break;
    if (seen.has(product.id) || HERO_SLUGS.has(product.slug)) continue;
    if (rest.some((existing) => existing.category.slug === product.category.slug)) continue;
    rest.push(product);
    seen.add(product.id);
  }
  // Category-diverse pass filled what it could; top up with anything left
  // (still excluding what's already picked) so the fan always reaches
  // seven tiles even on a catalogue with fewer than seven categories
  // represented.
  for (const product of withPhotos) {
    if (rest.length >= COLLAGE_SIZE - 1) break;
    if (seen.has(product.id)) continue;
    rest.push(product);
    seen.add(product.id);
  }

  // `lead` last, not first — `atelier-collage.tsx`'s `TILES` array marks its
  // *last* entry as the front/framed tile, so this is what actually puts
  // Monsoon Blooms in that position rather than as one of the six background
  // tiles.
  const collageProducts = [...rest, lead].filter((product): product is Product =>
    Boolean(product),
  );

  return (
    <section
      id="atelier"
      className="dark-section atelier-drift relative scroll-mt-[var(--nav-h)] overflow-hidden bg-ink text-paper"
    >
      {/* 40/60 split (client brief, 2026-08-27) via the nearest whole
          columns on the locked 12-column grid — `lg:col-span-5`/`7`. */}
      <div className="mx-auto grid max-w-shell gap-12 px-6 py-24 md:px-12 lg:px-20 md:py-32 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="relative order-2 lg:order-1 lg:col-span-5">
          {collageProducts.length > 0 && <AtelierCollage products={collageProducts} />}
        </div>

        {/*
          Text column: each line rises and fades in, 0.1s apart (client
          brief, 2026-08-25). This retires the previous pass's "slide from
          the right" scoped exception in favour of the brand's standard
          `Reveal` direction — SKILL.md §7 has been updated to match.
        */}
        <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-8">
          <Reveal>
            <p className="label text-purple-300">Inside the atelier</p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Three lines, not two — the brief's own line-breaking ("THE
                CLOTH, / BEFORE / THE CUT."). Set larger and tighter than
                before so it carries the section the way the hero headline
                carries the page. */}
            <h2 className="mt-6 font-display text-balance text-[clamp(2.75rem,5.5vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-paper">
              The cloth,
              <br />
              before
              <br />
              the cut.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-paper/70">
              Every panel is checked on the roll — front, back, sleeve, daman —
              before it is folded. What reaches you is uncut, so nothing about
              the fit has been decided without you.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <StitchDivider invert className="mt-10 max-w-[280px]" />
          </Reveal>

          <Reveal delay={0.4}>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {[
                { value: "3", label: "Pieces per suit" },
                { value: String(pieceCount), label: "Pieces in this edit" },
                { value: "6", label: "Cloths on offer" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold tracking-[-0.03em] text-purple-300">
                      {stat.value}
                    </span>
                    <span className="label mt-2 block text-paper/55">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/*
            The CTA returns the reader to shopping rather than jumping them
            to the footer. It previously pointed at `#stockists`, which is
            the footer anchor — the one link in the page's whole narrative
            arc that dead-ends the reader at the bottom of the document
            instead of moving them forward. Phase 6's own rhythm ("story →
            return naturally back into shopping") is what this now does,
            without adding a new section to carry it.
          */}
          <Reveal delay={0.5}>
            <div className="mt-12">
              <ThreadButton href="/#collection" tone="solid-invert" icon>
                Shop the edit
              </ThreadButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
