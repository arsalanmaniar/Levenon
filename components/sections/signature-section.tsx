import { ThreadButton } from "@/components/ui/thread-button";
import { Reveal } from "@/components/ui/reveal";
import { StitchDivider } from "@/components/ui/stitch-divider";
import { AtelierImageReveal } from "@/components/sections/atelier-image-reveal";
import { getCollectionSummary, listProducts } from "@/lib/server/products";

/**
 * The single dark section on the page — the rhythm beat (SKILL.md §6).
 *
 * Roles invert: ink ground, paper type, purple-300 thread. The sculpture
 * (client brief, 2026-08-24) is now a real textile detail photograph instead.
 */
export async function SignatureSection() {
  const { pieceCount } = await getCollectionSummary();
  const withPhotos = (await listProducts()).filter((product) => product.images[0]);
  // Offset past the hero's own first 3, so the two sections don't repeat a
  // photo — falls back to the first available image if the catalogue is thin.
  const atelierPhoto = withPhotos[3] ?? withPhotos[0];

  return (
    <section
      id="atelier"
      className="dark-section atelier-drift relative scroll-mt-[var(--nav-h)] overflow-hidden bg-ink text-paper"
    >
      <div className="mx-auto grid max-w-shell gap-12 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="relative order-2 lg:order-1 lg:col-span-6">
          {/* 400×500 (client brief) as the aspect ratio + max size, scaling
              down responsively below that rather than a rigid box that would
              break on narrow viewports. */}
          {atelierPhoto ? (
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px] border border-paper/10 lg:mx-0">
              <AtelierImageReveal
                src={atelierPhoto.images[0].url}
                alt={atelierPhoto.images[0].alt || atelierPhoto.name}
              />
            </div>
          ) : null}
        </div>

        {/*
          Text column fades in from the right on scroll (Priority 4), a
          scoped exception to SKILL.md §7's "never slide from off-screen
          sides" — documented there directly rather than broken silently.
          The offset stays small (24px, `Reveal`'s own `from="right"`) so it
          still reads as the brand's usual rise-and-fade, just off a
          different edge, not an off-screen slide-in.
        */}
        <div className="order-1 lg:order-2 lg:col-span-6 lg:pl-8">
          <Reveal from="right">
            <p className="label text-purple-300">Inside the atelier</p>
          </Reveal>

          <Reveal from="right" delay={0.08}>
            {/* Three lines, not two — the brief's own line-breaking ("THE
                CLOTH, / BEFORE / THE CUT."). Set larger and tighter than
                before so it carries the section the way the hero headline
                carries the page. */}
            <h2 className="mt-6 font-display text-[clamp(2.75rem,5.5vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.03em]">
              The cloth,
              <br />
              before
              <br />
              the cut.
            </h2>
          </Reveal>

          <Reveal from="right" delay={0.16}>
            <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-paper/70">
              Every panel is checked on the roll — front, back, sleeve, daman —
              before it is folded. What reaches you is uncut, so nothing about
              the fit has been decided without you.
            </p>
          </Reveal>

          <Reveal from="right" delay={0.2}>
            <StitchDivider invert className="mt-10 max-w-[280px]" />
          </Reveal>

          <Reveal from="right" delay={0.24}>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {[
                { value: "3", label: "Pieces per suit" },
                { value: String(pieceCount), label: "Pieces in this edit" },
                { value: "6", label: "Cloths on offer" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-5xl font-extrabold tracking-[-0.03em] text-purple-300">
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
          <Reveal from="right" delay={0.28}>
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
