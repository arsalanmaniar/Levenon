import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";

export const metadata: Metadata = {
  title: "The Atelier",
  description: "A closer look at the Levenon atelier — coming soon.",
  alternates: { canonical: "/atelier" },
};

/**
 * Placeholder route (client brief, 2026-08-24) so "Explore the Atelier" has
 * somewhere real to land. The dark signature section on `/` (`#atelier`)
 * still carries the actual atelier story — this is a standalone page for a
 * future, fuller version of it, not a duplicate of that content.
 */
export default function AtelierPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto flex min-h-[calc(100vh-var(--nav-h))] max-w-shell flex-col items-center justify-center px-6 py-24 text-center md:px-10">
          {/* The ring, quiet — same motif as every other empty/placeholder state. */}
          <svg
            viewBox="0 0 120 120"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            className="h-20 w-20 text-purple-500"
          >
            <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
            <circle
              cx="60"
              cy="60"
              r="26"
              strokeWidth="1"
              strokeOpacity="0.4"
              strokeDasharray="5 7"
            />
          </svg>

          <p className="label mt-8 text-charcoal">Inside the atelier</p>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            The Atelier — Coming Soon
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-charcoal">
            The full story of how each piece is cut is still being written.
            In the meantime, the collection speaks for itself.
          </p>

          <Link
            href="/#collection"
            className="label mt-10 inline-flex min-h-[48px] items-center rounded-full bg-ink px-7 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
          >
            Shop Collection
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
