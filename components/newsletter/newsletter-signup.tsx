import { NewsletterForm } from "./newsletter-form";

/**
 * Newsletter signup.
 *
 * Placement: between the product grid and the dark signature section. §6 makes
 * the inversion the page's closing beat; putting the signup after it would
 * demote the atelier story and leave two paper blocks adjacent with no change
 * in rhythm. Here it is the breath after a dense grid, and it answers the
 * question the grid raises — small runs sell through, so how do you hear about
 * the next one.
 *
 * Only the form hydrates. This wrapper is a server component: the heading and
 * copy are static, and shipping them as a client island cost ~40 ms of TBT on
 * the home page for nothing.
 */
export function NewsletterSignup() {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="scroll-mt-[var(--nav-h)]"
    >
      <div className="mx-auto max-w-shell px-6 md:px-10">
        <div className="grid gap-10 border-t border-hairline py-20 md:py-28 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <p className="label text-charcoal">The list</p>
            <h2
              id="newsletter-title"
              className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]"
            >
              Know when the next run is cut.
            </h2>
            <p className="mt-6 max-w-measure text-base leading-relaxed text-charcoal">
              Runs are small and they sell through. One note when a cut goes on
              the rail, and nothing else.
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
