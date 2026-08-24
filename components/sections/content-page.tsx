import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";

/**
 * Shared shell for the small content routes (shipping, returns, size guide,
 * contact).
 *
 * One component rather than four near-identical page bodies: these pages exist
 * to answer a question and get out of the way, and the moment their headers
 * are copy-pasted they start drifting apart. The measure is deliberately
 * narrow — this is reading matter, not a landing page — and it follows
 * `/track`'s centred-column precedent for exactly the reason recorded there:
 * a single column of prose laid across the twelve-column shell leaves the
 * right-hand side empty and reads as unfinished.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main id="main">
        <article className="mx-auto max-w-2xl px-6 py-16 md:py-24">
          <p className="label text-charcoal">{eyebrow}</p>
          {/* Page H1 tier (SKILL.md §3), the same one `/track` and
              `/wishlist` use. */}
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-charcoal">{intro}</p>

          <div className="mt-12 space-y-10">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** One question-and-answer block. */
export function ContentSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="font-display text-xl font-bold tracking-[-0.02em]">
        {heading}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-charcoal">
        {children}
      </div>
    </section>
  );
}
