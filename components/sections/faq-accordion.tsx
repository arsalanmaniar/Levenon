"use client";

import { useId, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export type FaqItem = { q: string; a: string };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

/**
 * One category (client brief, 2026-08-31) — the accordion unit is the
 * category, not the individual question; every Q&A inside an open category
 * renders in full. Same height-measuring `AnimatePresence` idiom as
 * `pdp-accordion.tsx`, the only other place this site needs one.
 */
function FaqCategorySection({
  category,
  defaultOpen,
}: {
  category: FaqCategory;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reducedMotion = usePrefersReducedMotion();
  const idBase = useId().replace(/:/g, "");
  const panelId = `${idBase}-panel`;
  const buttonId = `${idBase}-button`;

  return (
    <div
      className={cn(
        "border-t border-hairline pl-0 transition-[padding,border-color] duration-200 ease-state",
        open && "border-l-2 border-l-purple-500 pl-4",
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-[56px] w-full items-center justify-between gap-4 py-5 text-left"
        >
          <span className="font-display text-base font-semibold tracking-[-0.01em] text-ink">
            {category.title}
          </span>
          <ChevronDown
            aria-hidden="true"
            size={20}
            strokeWidth={1.5}
            className={cn(
              "shrink-0 text-charcoal transition-transform duration-300 ease-state",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reducedMotion ? {} : { height: 0, opacity: 0 }}
            animate={reducedMotion ? {} : { height: "auto", opacity: 1 }}
            exit={reducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pb-6">
              {category.items.map((item) => (
                <div key={item.q}>
                  <p className="font-display text-[14px] font-medium text-ink">{item.q}</p>
                  <p className="mt-2 max-w-measure font-sans text-[14px] leading-[1.7] text-charcoal">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The full FAQ list — six category accordions, the first open by default. */
export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="border-b border-hairline">
      {categories.map((category, index) => (
        <FaqCategorySection key={category.id} category={category} defaultOpen={index === 0} />
      ))}
    </div>
  );
}
