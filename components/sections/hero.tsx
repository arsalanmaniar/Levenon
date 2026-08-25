import { BackgroundBeams } from "@/components/ui/background-beams";
import { HeroAurora } from "@/components/ui/hero-aurora";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { ThreadButton } from "@/components/ui/thread-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Reveal } from "@/components/ui/reveal";
import { HeroCollage } from "@/components/sections/hero-collage";
import { getCollectionSummary, listProducts } from "@/lib/server/products";

const FOOTNOTES = ["Three pieces, uncut", "Hand embroidery", "Come back daily"];

/**
 * The one loud moment on the page: the thread knot, with the headline sitting
 * over it. Everything below stays quiet by comparison (SKILL.md §5).
 *
 * The canvas slot is sized in both axes before anything loads, so the sculpture
 * arriving late never shifts the type.
 */
// Five fabrics, not six — the brief's own list for the collage (client
// brief, 2026-08-26) omits "net", so this is deliberate, not an oversight.
const COLLAGE_CATEGORIES = ["lawn", "chiffon", "silk", "cotton", "organza"];

export async function Hero() {
  const { season, pieceCount } = await getCollectionSummary();
  // "5 diverse products... different fabrics" (client brief, 2026-08-26):
  // one per target category, read through the one data seam (`listProducts`)
  // rather than the raw file. Falls back to filling from the rest of the
  // catalogue if a category has no photographed product, so the collage
  // still renders 5 tiles even on a thin catalogue.
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);
  const collage = COLLAGE_CATEGORIES.map((slug) =>
    withPhotos.find((product) => product.category.slug === slug),
  ).filter((product): product is NonNullable<typeof product> => Boolean(product));
  for (const product of withPhotos) {
    if (collage.length >= 5) break;
    if (!collage.includes(product)) collage.push(product);
  }

  /*
   * `lg:min-h-[90vh]` (restored 2026-08-24, bounded this time): the fully
   * unconstrained version removed earlier fixed a real dead-space bug (a
   * hard `100vh` floor left empty space below the CTAs on any screen taller
   * than the content), but going all the way to "no floor at all" undersold
   * the hero on typical desktop viewports — a fashion hero is supposed to
   * command the first screen. 90vh, `lg` only, is the middle ground: on the
   * common 900–1080px-tall desktop viewports this project actually measures
   * against, the content itself (headline + CTA row + footnote row + up to
   * a 700px canvas column, all inside the section's own padding) already
   * runs to roughly 850–950px, so the floor rarely has to add real empty
   * space — it mostly just guarantees the full-bleed feel holds on shorter
   * content days rather than manufacturing a gap on tall monitors. Below
   * `lg` the section stays purely content-sized, as before.
   */
  return (
    <section className="relative flex flex-col justify-center overflow-hidden lg:min-h-[90vh]">
      {/* Slow paper→purple radial drift, decorative, CSS-only — sits under the beams. */}
      <HeroAurora />
      {/* Subtle purple drift behind the sculpture; decorative, CSS-only. */}
      <BackgroundBeams />
      {/* `gap-6` on mobile, not `gap-10`: with the sculpture now sitting
          between the headline and the body copy, two 40px gaps stacked
          either side of it read as the section falling apart rather than as
          rhythm. Desktop keeps its own gutter via `lg:gap-x-6`. */}
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 gap-6 px-6 pb-14 pt-12 md:px-12 lg:px-20 md:pb-16 md:pt-24 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-6 lg:gap-y-0 lg:pb-20 lg:pt-28">
        {/*
          Three blocks, explicitly ordered, rather than the previous
          two-column split (2026-08-24, Phase 8). On mobile the required
          reading order is eyebrow → headline → sculpture → CTAs, which the
          old structure could not produce: the canvas was a sibling *after*
          the entire text column, so on a phone it always landed below the
          footnotes, at the very bottom of the hero, where it read as an
          afterthought rather than as the product world.

          Explicit `lg:col-start`/`lg:row-start` puts the desktop layout back
          exactly as it was — headline block and body block stacked in the
          left column, canvas spanning both rows on the right — without
          relying on source order to do it, which is what let the mobile
          order change independently in the first place.
        */}
        <div className="relative z-10 order-1 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:self-end lg:pr-8">
          <Reveal>
            <p className="label text-charcoal">
              {season} — {pieceCount} pieces
            </p>
          </Reveal>

          {/*
            `animationDelay` as an inline style, not a Tailwind
            `[animation-delay:…]` arbitrary utility: `animate-hero-fade-up`
            itself sets the `animation` shorthand, which resets
            `animation-delay` to 0s as part of that one declaration — whether
            a separate utility class "wins" depends on generated-CSS source
            order, which Tailwind doesn't guarantee here. An inline style
            always wins regardless of that order, so the 150ms stagger
            actually holds.
          */}
          <h1
            style={{ animationDelay: "150ms" }}
            className="mt-6 animate-hero-fade-up font-display text-balance text-[clamp(4rem,9vw,6.875rem)] font-extrabold leading-[0.92] tracking-[-3px] motion-reduce:animate-none"
          >
            Unstitched.
            <br />
            Yours to finish.
          </h1>
        </div>

        {/* Body block — copy, CTAs, footnotes. `order-3` on mobile puts it
            after the sculpture; on desktop it returns to the left column
            directly under the headline. */}
        <div className="relative z-10 order-3 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2 lg:self-start lg:pr-8">
          <Reveal delay={0.35}>
            <p className="mt-7 max-w-measure text-lg leading-relaxed text-charcoal">
              Three pieces, uncut — shirt, trouser and dupatta. We choose the
              cloth and set the embroidery; the fit is decided by your own
              tailor, not by us.
            </p>
          </Reveal>

          <Reveal delay={0.55}>
            {/* Stacked full-width below `sm` — two 56px-tall buttons side by
                side at 320px measured to 296px against ~272px available, a
                real overflow. From `sm` up they sit inline as before. */}
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {/*
                Height override only — padding and type size now come from the
                button system rather than a bespoke `px-9`/`text-[13px]` pair.
                Those overrides, together with `.label` going 11px → 12px,
                widened the two CTAs past the ~608px hero column and wrapped
                them onto separate lines on desktop; the hero is the one place
                that could least afford it.
              */}
              <ShimmerButton
                href="#collection"
                icon
                className="min-h-[56px] justify-center sm:justify-start"
              >
                Shop Collection
              </ShimmerButton>
              {/* "Ghost" here means the outline tone that already exists in
                  this system: transparent fill, hairline border, no
                  competing weight against the primary shimmer button — the
                  same shape most design systems mean by "ghost", just built
                  on this brand's existing button rather than a new variant. */}
              {/* Points at the standalone /atelier route (client brief,
                  2026-08-24), not the in-page #atelier section — the nav's
                  own "Atelier" link still scrolls to that section directly. */}
              <ThreadButton
                href="/atelier"
                tone="outline"
                className="min-h-[56px] justify-center sm:justify-start"
              >
                Explore the Atelier
              </ThreadButton>
            </div>
          </Reveal>

          {/* Mono footnote row — larger and more deliberate, a hairline
              separator between each item rather than bare gap-only spacing. */}
          <Reveal delay={0.7}>
            {/* Stacked with horizontal dividers below `sm` — a wrapping flex
                row with `divide-x` leaves a stray leading divider on the
                wrapped line at narrow widths, which a vertical stack with
                `divide-y` cannot do, since nothing ever wraps mid-item. */}
            <div className="mt-14 flex flex-col divide-y divide-hairline border-y border-hairline sm:flex-row sm:flex-wrap sm:divide-x sm:divide-y-0">
              {FOOTNOTES.map((line) => (
                <span
                  key={line}
                  // `sm:px-4`, down from `px-5`: with `.label` at 12px the
                  // three items no longer fitted the hero's left column and
                  // the third wrapped to its own line, leaving a stray
                  // divider hanging under the first two.
                  className="label py-3 text-charcoal sm:px-4 sm:py-5 sm:first:pl-0 sm:last:pr-0"
                >
                  {line}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Editorial collage slot — `order-2` on mobile sits it between the
            headline and the CTAs; on desktop it spans both rows of the right
            column. Replaces the R3F sculpture (client brief, 2026-08-24):
            three real product photographs, fanned and overlapping, so the
            hero reads as "fashion product" on first paint rather than as a
            3D demo. Cinematic entrance/parallax/Ken Burns live in the client
            island below (client brief, 2026-08-25). */}
        <div className="relative order-2 lg:order-none lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
          <HeroCollage products={collage} />
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
