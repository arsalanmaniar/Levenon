/**
 * Card-shaped placeholder held while the catalogue resolves.
 *
 * Same box, same hairline border, same 4:5 tile as the real card, so the grid
 * does not reflow when data lands. The only motion is a slow opacity pulse,
 * which `prefers-reduced-motion` flattens via globals.css.
 */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse [animation-duration:2s]">
      <div className="relative aspect-[4/5] border border-hairline bg-paper">
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-24 w-24 rounded-full border border-hairline" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div className="h-4 w-32 bg-hairline" />
        <div className="h-3 w-20 bg-hairline" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3 w-full bg-hairline/70" />
        <div className="h-3 w-3/5 bg-hairline/70" />
      </div>

      <div className="mt-4 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-9 rounded-full border border-hairline" />
        ))}
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
