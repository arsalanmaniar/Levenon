import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";

export const metadata: Metadata = {
  title: "Stockists",
  description: "Find Levenon near you — coming soon.",
  alternates: { canonical: "/stockists" },
};

/**
 * Placeholder route (client brief, 2026-08-26), same pattern as `/atelier`:
 * there is no stockist list anywhere in this codebase to render honestly, so
 * this states that plainly rather than inventing store names or addresses.
 */
export default function StockistsPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto flex min-h-[calc(100vh-var(--nav-h))] max-w-shell flex-col items-center justify-center px-6 py-24 text-center md:px-12 lg:px-20">
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

          <p className="label mt-8 text-charcoal">Find us</p>
          <h1 className="mt-5 text-balance font-display text-balance text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Coming Soon — Find Levenon near you
          </h1>
          <p className="mt-6 max-w-[46ch] text-body leading-relaxed text-charcoal">
            Levenon is online-only for now. A stockist list will land here
            once there is one to show.
          </p>

          <Link
            href="/shop"
            className="label mt-10 inline-flex min-h-[48px] items-center rounded-full bg-ink px-7 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
          >
            Shop the collection
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
