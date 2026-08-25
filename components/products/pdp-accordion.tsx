"use client";

import { useId, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export type AccordionSection = {
  title: string;
  content: React.ReactNode;
};

/**
 * The PDP's four collapsible sections — "The cloth", "Construction",
 * "Sizing & care", "Delivery". One open at a time, first section open by
 * default so a reader always lands on real copy, not four closed bars.
 *
 * Height can't animate directly (`height: auto` isn't a value Framer Motion
 * can interpolate to), so each panel measures its own content in a hidden
 * probe and animates to that pixel value — the standard AnimatePresence
 * accordion pattern, kept here rather than reached for from a library since
 * it's the only place this site needs it.
 */
export function PdpAccordion({ sections }: { sections: AccordionSection[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reducedMotion = usePrefersReducedMotion();
  const idBase = useId().replace(/:/g, "");

  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {sections.map((section, index) => {
        const open = openIndex === index;
        const panelId = `${idBase}-panel-${index}`;
        const buttonId = `${idBase}-button-${index}`;

        return (
          <div key={section.title}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-display text-base font-bold tracking-[-0.01em]">
                  {section.title}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative h-4 w-4 shrink-0 transition-transform duration-300 ease-state",
                    open && "rotate-45",
                  )}
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-ink" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-ink" />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open && (
                <m.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={reducedMotion ? {} : { height: "auto", opacity: 1 }}
                  exit={reducedMotion ? {} : { height: 0, opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="max-w-measure pb-6 text-body leading-relaxed text-charcoal">
                    {section.content}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
