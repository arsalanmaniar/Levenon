import { ThreadCanvas } from "@/components/3d/thread-canvas";
import { ThreadButton } from "@/components/ui/thread-button";
import { Reveal } from "@/components/ui/reveal";
import { StitchDivider } from "@/components/ui/stitch-divider";
import { getCollectionSummary } from "@/lib/server/products";

/**
 * The single dark section on the page — the rhythm beat (SKILL.md §6).
 *
 * Roles invert: ink ground, paper type, purple-300 thread. This is the only
 * place bloom is allowed, and only on capable hardware.
 */
export async function SignatureSection() {
  const { pieceCount } = await getCollectionSummary();

  return (
    <section
      id="atelier"
      className="dark-section atelier-drift relative scroll-mt-[var(--nav-h)] overflow-hidden bg-ink text-paper"
    >
      <div className="mx-auto grid max-w-shell gap-12 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="relative order-2 lg:order-1 lg:col-span-6">
          <div className="relative mx-auto h-[clamp(300px,58vw,420px)] w-full max-w-[520px] lg:h-[min(68vh,600px)] lg:max-w-none">
            {/*
              Floor glow, matching the hero's own treatment exactly (same
              radial-gradient recipe, same purple token) so the two
              sculptures read as the same physical object photographed in
              two different rooms rather than two unrelated art styles —
              Phase 6's explicit ask. Purple-300 here rather than
              purple-500: on the ink ground the darker accent is nearly
              invisible, the same reason the rest of this section swaps to
              the lighter purple.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[10%] bottom-[6%] top-[55%] -z-10"
              style={{
                backgroundImage:
                  "radial-gradient(closest-side, rgb(var(--purple-300-rgb) / 0.22), transparent 75%)",
              }}
            />
            <ThreadCanvas variant="dark" />
          </div>
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
