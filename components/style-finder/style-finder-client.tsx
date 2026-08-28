"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, Check, Link as LinkIcon, RotateCcw } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { ThreadButton } from "@/components/ui/thread-button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useToast } from "@/components/providers/toast-provider";
import { matchProducts, type StyleFinderSelections } from "@/lib/style-finder";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
const ADVANCE_DELAY_MS = 280;

type StepKey = keyof StyleFinderSelections;

const STEPS: Array<{
  key: StepKey;
  param: string;
  question: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    key: "occasion",
    param: "o",
    question: "What's your occasion?",
    options: [
      { value: "daily", label: "Daily wear" },
      { value: "formal", label: "Formal" },
      { value: "wedding", label: "Wedding" },
      { value: "work", label: "Work" },
    ],
  },
  {
    key: "fabric",
    param: "f",
    question: "Your fabric preference?",
    options: [
      { value: "airy", label: "Airy & Light" },
      { value: "heavy", label: "Rich & Heavy" },
      { value: "between", label: "Somewhere between" },
    ],
  },
  {
    key: "style",
    param: "s",
    question: "Your style?",
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "embroidered", label: "Embroidered" },
      { value: "bold", label: "Bold prints" },
      { value: "classic", label: "Classic" },
    ],
  },
  {
    key: "budget",
    param: "b",
    question: "Your budget?",
    options: [
      { value: "under4000", label: "Under PKR 4,000" },
      { value: "mid", label: "PKR 4,000 – 6,000" },
      { value: "above6000", label: "Above PKR 6,000" },
    ],
  },
];

type PartialSelections = Partial<Record<StepKey, string>>;

function selectionsFromSearch(search: string): PartialSelections | null {
  const params = new URLSearchParams(search);
  const found: PartialSelections = {};
  for (const step of STEPS) {
    const value = params.get(step.param);
    if (!value || !step.options.some((option) => option.value === value)) return null;
    found[step.key] = value;
  }
  return found;
}

function buildShareUrl(selections: StyleFinderSelections): string {
  const params = new URLSearchParams();
  for (const step of STEPS) {
    params.set(step.param, selections[step.key]);
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/style-finder?${params.toString()}`;
}

/**
 * Full-screen 4-step quiz (client brief, 2026-08-31, "1 amazing new
 * feature", chosen alongside the fabric guide — see the spec log for why).
 * `products` arrives pre-fetched from the server page, the same
 * server-fetches/client-animates split every other section on this site
 * uses; there is no client-side data fetch here at all.
 *
 * Reveals are fade + a small vertical rise, never a slide from the side —
 * SKILL.md §7 forbids off-screen-side entrances, which rules out the more
 * obvious "slide to the next question" transition a step quiz might reach
 * for by default.
 */
export function StyleFinderClient({ products }: { products: Product[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<PartialSelections>({});

  // Deep-link: a shared result URL carries all four answers as query
  // params. Server HTML always renders step one — search params aren't
  // available server-side — and `useLayoutEffect` runs synchronously before
  // the browser's first paint, so a shared link jumps straight to results
  // with no flash of step one in between. Unlike `announcement-bar.tsx`'s
  // sessionStorage read, nothing here needs to *hide* content until this
  // runs: step one is a perfectly valid thing to paint first.
  useLayoutEffect(() => {
    const found = selectionsFromSearch(window.location.search);
    if (found) {
      setSelections(found);
      setStep(STEPS.length);
    }
  }, []);

  const isComplete = STEPS.every((s) => selections[s.key]);
  const results = useMemo(
    () => (isComplete ? matchProducts(products, selections as StyleFinderSelections) : []),
    [isComplete, products, selections],
  );

  const choose = (key: StepKey, value: string) => {
    const next = { ...selections, [key]: value };
    setSelections(next);
    window.setTimeout(() => {
      setStep((current) => Math.min(current + 1, STEPS.length));
    }, ADVANCE_DELAY_MS);
  };

  const reset = () => {
    setSelections({});
    setStep(0);
    window.history.replaceState(null, "", "/style-finder");
  };

  const share = async () => {
    if (!isComplete) return;
    const url = buildShareUrl(selections as StyleFinderSelections);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied", "success");
    } catch {
      showToast("Couldn't copy — copy the address bar instead", "error");
    }
  };

  const atResults = step >= STEPS.length;
  const progressPct = Math.min(100, (step / STEPS.length) * 100);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--nav-h)-var(--announcement-h))] max-w-shell flex-col px-6 py-12 md:px-12 md:py-16 lg:px-20">
      {/* Progress bar — four segments' worth of purple-500 fill. */}
      <div className="h-px w-full bg-hairline">
        <div
          className="h-px bg-purple-500 transition-[width] duration-300 ease-state"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-center py-16">
        <AnimatePresence mode="wait" initial={false}>
          {!atResults ? (
            <m.div
              key={step}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: ENTRANCE_EASE }}
            >
              <p className="label text-charcoal">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="mt-4 max-w-[18ch] font-display text-h2 font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
                {STEPS[step].question}
              </h1>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {STEPS[step].options.map((option) => {
                  const selected = selections[STEPS[step].key] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(STEPS[step].key, option.value)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-[72px] items-center justify-between gap-3 border px-6 py-5 text-left transition-colors duration-200 ease-state",
                        selected
                          ? "border-purple-500 bg-purple-500/5"
                          : "border-hairline hover:border-ink",
                      )}
                    >
                      <span className="font-display text-base font-semibold text-ink">
                        {option.label}
                      </span>
                      {selected && (
                        <Check aria-hidden="true" size={18} strokeWidth={2} className="shrink-0 text-purple-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  className="label mt-10 inline-flex min-h-[44px] items-center gap-2 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                >
                  <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} />
                  Back
                </button>
              )}
            </m.div>
          ) : (
            <m.div
              key="results"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: ENTRANCE_EASE }}
            >
              <p className="label text-charcoal">Picked for you</p>
              <h1 className="mt-4 font-display text-h2 font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
                Your edit
              </h1>

              {results.length === 0 ? (
                <p className="mt-6 max-w-measure text-body text-charcoal">
                  Nothing in the catalogue matches that combination right now — try different
                  answers.
                </p>
              ) : (
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              <div className="mt-12 flex flex-wrap items-center gap-4">
                <ThreadButton href="/shop" tone="solid">
                  Shop the full edit
                </ThreadButton>
                <button
                  type="button"
                  onClick={share}
                  className="label inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline px-5 text-ink transition-colors duration-200 ease-state hover:border-ink"
                >
                  <LinkIcon aria-hidden="true" size={16} strokeWidth={1.5} />
                  Share my result
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="label inline-flex min-h-[48px] items-center gap-2 text-charcoal transition-colors duration-200 ease-state hover:text-ink"
                >
                  <RotateCcw aria-hidden="true" size={16} strokeWidth={1.5} />
                  Retake the quiz
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
