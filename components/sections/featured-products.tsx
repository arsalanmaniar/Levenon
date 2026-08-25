import Link from "next/link";
import { QuickAddCard } from "@/components/products/quick-add-card";
import { Reveal } from "@/components/ui/reveal";
import { listProducts, getCollectionSummary } from "@/lib/server/products";

/**
 * The editorial rail — the first thing a reader sees below the hero, before
 * the full filterable grid.
 *
 * Composed as a campaign page rather than a product row: an asymmetric
 * 1-large-plus-3 layout, a masthead that runs the season line and the
 * "view everything" action on opposite ends of a hairline rule, and a short
 * editorial standfirst between them. The point of the hierarchy is that the
 * lead piece reads as *chosen* — the same four products in four equal boxes
 * would say "catalogue", not "edit".
 *
 * Shoppability is deliberately not sacrificed to the editorial framing: every
 * tile still carries name, price, fabric and a quick-add control (see
 * `QuickAddCard`), because a campaign the customer cannot buy from is a
 * lookbook, not a storefront.
 *
 * "New arrivals" reads by recency (`createdAt`), not catalogue order —
 * `listProducts()` has no sort option of its own, and adding one for a
 * four-item read here is not worth a new query parameter on the shared seam.
 */
export async function FeaturedProducts() {
  const [catalogue, summary] = await Promise.all([
    listProducts(),
    getCollectionSummary(),
  ]);

  const featured = [...catalogue]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  if (featured.length === 0) return null;

  const [large, ...rest] = featured;

  return (
    <section id="new-in" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 pb-20 pt-20 md:px-10 md:pb-28 md:pt-24">
        {/*
          Masthead: season line and the escape hatch to the full grid sit on
          the same baseline, separated by a hairline — the magazine
          convention, and it puts "see everything" in the reader's eye before
          they have scrolled four products, rather than only after.
        */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-hairline pb-6">
            <div>
              <p className="label text-charcoal">New Arrivals</p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                Just landed.
              </h2>
            </div>

            <Link
              href="/#collection"
              className="label group inline-flex min-h-[44px] items-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500"
            >
              <span className="relative">
                View all {summary.pieceCount} pieces
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100" />
              </span>
              <span aria-hidden="true" className="transition-transform duration-200 ease-state group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </Reveal>

        {/* Editorial standfirst — one sentence, set at reading size against
            the measure, not another block of small grey UI text. */}
        <Reveal delay={0.06}>
          <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-charcoal">
            Six cloths, cut in small runs. These four opened the season — the
            lead piece is where the embroidery is heaviest.
          </p>
        </Reveal>

        {/*
          Asymmetric on purpose: the lead piece takes two of three columns,
          the other three stack in the remaining one. Below `md` everything
          collapses to a single column in source order, so the lead piece
          still leads on a phone.

          The side column is its own flex stack rather than three cells of a
          `grid-rows-3`. With explicit grid rows the three rows are forced to
          equal height off the tallest content, and since each small card is
          shorter than that, every one of them sat in an over-tall row with a
          visible gap underneath — caught in screenshot review, not by
          reading the markup. A flex column sizes each card to its own
          content and distributes only the real remaining space.
        */}
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-start">
          <Reveal className="md:col-span-2">
            <QuickAddCard product={large} large priority />
          </Reveal>

          <div className="flex flex-col gap-6">
            {rest.map((product, index) => (
              <Reveal key={product.id} delay={0.06 * (index + 1)}>
                <QuickAddCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
