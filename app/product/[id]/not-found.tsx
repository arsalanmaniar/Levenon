import Link from "next/link";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { ThreadButton } from "@/components/ui/thread-button";

/** A piece that never existed, or one that has been cut from the season. */
export default function ProductNotFound() {
  return (
    <>
      <SiteNav />
      <main
        id="main"
        className="mx-auto flex min-h-[60vh] max-w-shell flex-col justify-center px-6 py-24 md:px-10"
      >
        <p className="label text-charcoal">404 — Off the rail</p>

        <h1 className="mt-6 max-w-measure font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          This piece is no longer cut.
        </h1>

        <p className="mt-6 max-w-measure text-base leading-relaxed text-charcoal">
          It may have sold through, or the link may be wrong. The current season
          is short — everything in it is one click away.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ThreadButton href="/#collection">See the collection</ThreadButton>
          <Link
            href="/"
            className="label inline-flex min-h-[44px] items-center rounded-full border border-hairline px-6 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
          >
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
