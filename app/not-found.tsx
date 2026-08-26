import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { ThreadButton } from "@/components/ui/thread-button";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Root 404 (client brief, 2026-08-30, Item 6D) — every route this app
 * doesn't recognise lands here; `/product/[id]`'s own `not-found.tsx` is
 * scoped to that one segment and stays a separate, more specific page
 * (different copy — "this piece is no longer cut" — for a route that
 * genuinely used to exist and was sold through, rather than a link that
 * was simply wrong).
 */
export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main
        id="main"
        className="mx-auto flex min-h-[calc(100vh-var(--nav-h))] max-w-shell flex-col items-center justify-center px-6 py-24 text-center md:px-12 lg:px-20"
      >
        {/* The ring, quiet — same motif as every other empty state, sitting
            behind the numeral rather than beside it. */}
        <div className="relative">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 text-purple-500 opacity-20"
          >
            <circle cx="100" cy="100" r="62" strokeWidth="1.5" />
            <circle
              cx="100"
              cy="100"
              r="44"
              strokeWidth="1"
              strokeOpacity="0.5"
              strokeDasharray="6 9"
            />
          </svg>
          <p
            aria-hidden="true"
            className="relative font-display text-[clamp(4.5rem,12vw,7rem)] font-extrabold leading-none tracking-[-0.03em] text-purple-500/20"
          >
            404
          </p>
        </div>

        <h1 className="mt-2 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
          This thread doesn&rsquo;t exist.
        </h1>

        <p className="mt-6 max-w-[46ch] text-body leading-relaxed text-charcoal">
          The page may have moved, or the link may be wrong. Everything on
          the current rail is one click away.
        </p>

        <div className="mt-10">
          <ThreadButton href="/shop">Back to Shop</ThreadButton>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
