import { SiteNav } from "@/components/sections/site-nav";
import { ThreadLoader } from "@/components/ui/thread-loader";

/**
 * Held while a product resolves. Mirrors the detail layout so the page settles
 * rather than jumps, and uses the thread ring — never a browser spinner.
 */
export default function ProductLoading() {
  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto max-w-shell px-6 py-12 md:px-12 lg:px-20 md:py-16">
        <ThreadLoader label="Pulling the thread" />

        <div
          aria-hidden="true"
          className="mt-10 grid animate-pulse gap-12 [animation-duration:2s] lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/5] border border-hairline bg-paper">
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-40 w-40 rounded-full border border-hairline" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-3 w-24 bg-hairline" />
            <div className="mt-6 h-10 w-3/4 bg-hairline" />
            <div className="mt-6 h-3 w-28 bg-hairline" />
            <div className="mt-10 space-y-3">
              <div className="h-3 w-full bg-hairline/70" />
              <div className="h-3 w-full bg-hairline/70" />
              <div className="h-3 w-2/3 bg-hairline/70" />
            </div>
            <div className="mt-10 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-12 rounded-full border border-hairline"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
