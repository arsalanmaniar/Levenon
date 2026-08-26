import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  /** Omit on the last item — the current page renders as plain text, not a link. */
  href?: string;
};

/**
 * Breadcrumbs (client brief, 2026-08-30, Item 6A) — "Home" is implicit and
 * always first; callers pass only the segments after it. A plain server
 * component: nothing here is interactive.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors duration-200 ease-state hover:text-ink">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-purple-300">
                /
              </span>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors duration-200 ease-state hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
