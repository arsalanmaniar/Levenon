"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Shown when loading a product throws — a dropped connection to the catalogue,
 * a bad response, anything unexpected.
 *
 * Deliberately not a dead end: retry first, collection second. The nav is
 * rendered by the segment above this one, so the user is never stranded.
 */
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced for whatever reporting gets wired later; the digest is the only
    // safe handle on a server error in production.
    console.error("Product page failed:", error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-shell flex-col justify-center px-6 py-24 md:px-10"
    >
      <p className="label text-purple-500">A dropped stitch</p>

      <h1 className="mt-6 max-w-measure font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
        We could not pull this piece.
      </h1>

      <p className="mt-6 max-w-measure text-base leading-relaxed text-charcoal">
        Something went wrong reaching the catalogue. It is not you — try again,
        and if it holds, the rest of the collection is still on the rail.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="label inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          Try again
        </button>
        <Link
          href="/#collection"
          className="label inline-flex min-h-[44px] items-center justify-center rounded-full border border-hairline px-6 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
        >
          Back to the collection
        </Link>
      </div>

      {error.digest && (
        <p className="label mt-10 text-charcoal">Reference {error.digest}</p>
      )}
    </main>
  );
}
