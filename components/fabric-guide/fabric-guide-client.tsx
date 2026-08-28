"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Scale, X } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import { formatPrice, type Category, type Product } from "@/lib/types";
import type { FabricGuideEntry } from "@/lib/fabric-guide-data";

const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;

/** The swatch is a woven-line texture built from the brand's own purple token, not a fabric photo the catalogue doesn't have — line spacing tightens with `weight`, so a heavier cloth reads as a denser weave. */
function Swatch({ weight }: { weight: FabricGuideEntry["weight"] }) {
  const spacing = weight === 1 ? 9 : weight === 2 ? 6 : 3;
  return (
    <div
      aria-hidden="true"
      className="h-16 w-16 shrink-0 border border-hairline bg-paper"
      style={{
        backgroundImage: `repeating-linear-gradient(-45deg, rgb(var(--purple-500-rgb) / 0.35) 0, rgb(var(--purple-500-rgb) / 0.35) 1px, transparent 1px, transparent ${spacing}px)`,
      }}
    />
  );
}

const ROWS: Array<{ label: string; key: keyof FabricGuideEntry }> = [
  { label: "Origin", key: "origin" },
  { label: "Texture", key: "texture" },
  { label: "Care", key: "care" },
  { label: "Best for", key: "bestFor" },
];

function CompareTable({
  entries,
  categories,
  onClose,
}: {
  entries: [FabricGuideEntry, FabricGuideEntry];
  categories: Map<string, Category>;
  onClose: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <m.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: ENTRANCE_EASE }}
      className="sticky bottom-6 z-20 mt-12 border border-ink bg-paper shadow-thread"
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <p className="label flex items-center gap-2 text-ink">
          <Scale aria-hidden="true" size={14} strokeWidth={1.5} />
          Comparing {entries.length} fabrics
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="flex min-h-[36px] min-w-[36px] items-center justify-center text-charcoal transition-colors duration-200 ease-state hover:text-ink"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-2 divide-x divide-hairline overflow-x-auto">
        {entries.map((entry) => (
          <div key={entry.slug} className="min-w-[220px] px-5 py-5">
            <p className="font-display text-base font-bold text-ink">
              {categories.get(entry.slug)?.name ?? entry.slug}
            </p>
            <dl className="mt-4 space-y-4">
              {ROWS.map((row) => (
                <div key={row.key}>
                  <dt className="label text-charcoal">{row.label}</dt>
                  <dd className="mt-1 text-[13px] leading-relaxed text-ink">
                    {entry[row.key] as string}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </m.div>
  );
}

function FabricCard({
  entry,
  category,
  related,
  selected,
  onToggle,
}: {
  entry: FabricGuideEntry;
  category: Category | undefined;
  related: Product[];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn("border p-6 transition-colors duration-200 ease-state", selected ? "border-purple-500" : "border-hairline")}>
      <div className="flex items-start gap-4">
        <Swatch weight={entry.weight} />
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-ink">
            {category?.name ?? entry.slug}
          </h3>
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            className={cn(
              "label mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 transition-colors duration-200 ease-state",
              selected
                ? "border-purple-500 bg-purple-500 text-paper"
                : "border-hairline text-charcoal hover:border-ink hover:text-ink",
            )}
          >
            <Scale aria-hidden="true" size={12} strokeWidth={1.5} />
            {selected ? "Selected" : "Compare"}
          </button>
        </div>
      </div>

      <dl className="mt-5 space-y-3">
        {ROWS.map((row) => (
          <div key={row.key}>
            <dt className="label text-charcoal">{row.label}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-ink">{entry[row.key] as string}</dd>
          </div>
        ))}
      </dl>

      {related.length > 0 && (
        <div className="mt-6 border-t border-hairline pt-5">
          <p className="label text-charcoal">In this fabric</p>
          <ul className="mt-3 flex gap-3">
            {related.map((product) => (
              <li key={product.id}>
                <Link href={`/product/${product.slug}`} className="group block w-20">
                  <div className="relative aspect-[3/4] overflow-hidden border border-hairline bg-paper">
                    {product.images[0] && (
                      <Image
                        src={product.images[0].url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-300 ease-state group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-charcoal">{formatPrice(product)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * The fabric guide's interactive body (client brief, 2026-08-31). Server
 * page fetches categories + a few in-stock products per category once;
 * everything below — the compare-two-fabrics tool included — runs off
 * that one payload, no client fetch.
 */
export function FabricGuideClient({
  entries,
  categories,
  productsByCategory,
}: {
  entries: FabricGuideEntry[];
  categories: Category[];
  productsByCategory: Map<string, Product[]>;
}) {
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  const toggle = (slug: string) => {
    setCompareSlugs((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      if (current.length >= 2) return [current[1], slug];
      return [...current, slug];
    });
  };

  const compareEntries =
    compareSlugs.length === 2
      ? (compareSlugs.map((slug) => entries.find((entry) => entry.slug === slug)!) as [
          FabricGuideEntry,
          FabricGuideEntry,
        ])
      : null;

  return (
    <div className="mx-auto max-w-shell px-6 py-16 md:px-12 md:py-20 lg:px-20">
      <Reveal>
        <p className="label text-charcoal">Click any two to compare</p>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, index) => (
          <Reveal key={entry.slug} delay={Math.min(index, 5) * 0.05}>
            <FabricCard
              entry={entry}
              category={categoryMap.get(entry.slug)}
              related={productsByCategory.get(entry.slug) ?? []}
              selected={compareSlugs.includes(entry.slug)}
              onToggle={() => toggle(entry.slug)}
            />
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {compareEntries && (
          <CompareTable
            entries={compareEntries}
            categories={categoryMap}
            onClose={() => setCompareSlugs([])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
