"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useModalBehaviour } from "@/hooks/use-modal-behaviour";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

// Brand easing: expo-out in, state curve out.
const EASE_IN = [0.16, 1, 0.3, 1] as const;
const EASE_OUT = [0.65, 0, 0.35, 1] as const;

type Unit = "cm" | "in";

/**
 * Body measurements, stored in **centimetres only**.
 *
 * Inches are derived on display rather than stored as a second column: two
 * hand-maintained sets of numbers drift the first time someone edits one, and
 * the conversion is exact enough at half-inch rounding.
 */
const SIZES = [
  { size: "XS", chest: 86, waist: 71, hips: 89 },
  { size: "S", chest: 91, waist: 76, hips: 94 },
  { size: "M", chest: 97, waist: 81, hips: 99 },
  { size: "L", chest: 104, waist: 89, hips: 107 },
  { size: "XL", chest: 112, waist: 97, hips: 114 },
] as const;

/** Centimetres → inches, rounded to the nearest half inch. */
function toInches(cm: number): string {
  return (Math.round((cm / 2.54) * 2) / 2).toFixed(1);
}

function measurement(cm: number, unit: Unit): string {
  return unit === "cm" ? String(cm) : toInches(cm);
}

export function SizeGuide() {
  const [open, setOpen] = useState(false);
  // Portals need a DOM target, which does not exist during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [unit, setUnit] = useState<Unit>("cm");
  const reducedMotion = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const titleId = `size-guide-${useId().replace(/:/g, "")}`;
  const close = useCallback(() => setOpen(false), []);

  useModalBehaviour({
    open,
    onClose: close,
    panelRef,
    rootRef,
    initialFocusRef: closeRef,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label inline-flex min-h-[44px] items-center text-charcoal underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
      >
        Size guide
      </button>

      {mounted &&
        createPortal(
          /*
           * Portalled to <body>.
           *
           * The trigger lives inside <main>, so a modal rendered in place would
           * be a descendant of <main> — and the inert sweep skips whichever
           * top-level element contains the modal, to avoid disabling itself.
           * The result was a dialog whose own page stayed fully exposed to a
           * screen reader. As a direct child of <body>, the modal is excluded
           * and <main> is correctly inert.
           */
          <AnimatePresence>
            {open && (
              <div ref={rootRef} className="fixed inset-0 z-[100]">
            <m.div
              aria-hidden="true"
              onClick={close}
              className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? {} : { opacity: 1 }}
              exit={reducedMotion ? {} : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_OUT }}
            />

            <m.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto overscroll-contain border-t border-hairline bg-paper sm:inset-0 sm:m-auto sm:h-fit sm:max-w-[640px] sm:border"
              initial={reducedMotion ? false : { y: "100%" }}
              animate={reducedMotion ? {} : { y: 0 }}
              exit={reducedMotion ? {} : { y: "100%" }}
              transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE_IN }}
            >
              <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
                <h2 id={titleId} className="label text-charcoal">
                  Size guide
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="label -mr-2 inline-flex min-h-[44px] items-center px-3 text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
                >
                  Close
                </button>
              </header>

              <div className="px-6 py-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="max-w-measure text-body leading-relaxed text-charcoal">
                    Every piece here is unstitched cloth, so none of it has a
                    finished size — these are the body measurements to hand your
                    tailor. Measure over what you would wear underneath.
                  </p>
                  <UnitToggle unit={unit} onChange={setUnit} />
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left">
                    <caption className="sr-only">
                      Body measurements by size, in{" "}
                      {unit === "cm" ? "centimetres" : "inches"}. Reference
                      figures for cutting — the cloth is sold unstitched.
                    </caption>
                    <thead>
                      <tr className="border-b border-hairline">
                        {["Size", "Chest", "Waist", "Hips"].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="label px-2 py-3 text-charcoal first:pl-0"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map((row) => (
                        <tr key={row.size} className="border-b border-hairline">
                          <th
                            scope="row"
                            className="label px-2 py-4 pl-0 text-ink"
                          >
                            {row.size}
                          </th>
                          {([row.chest, row.waist, row.hips] as const).map(
                            (value, index) => (
                              <td
                                key={index}
                                className="label px-2 py-4 text-charcoal"
                              >
                                {measurement(value, unit)}
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <HowToMeasure />
              </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/** CM / IN switch. Two buttons rather than a select — it is a binary choice. */
function UnitToggle({
  unit,
  onChange,
}: {
  unit: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center rounded-full border border-hairline p-1"
      role="group"
      aria-label="Measurement units"
    >
      {(["cm", "in"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          onClick={() => onChange(option)}
          className={cn(
            "label min-h-[36px] rounded-full px-4 transition-colors duration-200 ease-state",
            unit === option
              ? "bg-ink text-paper"
              : "text-charcoal hover:text-purple-500",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * How to measure — line art in the brand's own hand: a thin purple thread
 * tracing the measurement across a plain ink figure. No stock photography and
 * no third-party illustration.
 */
function HowToMeasure() {
  const steps = [
    {
      title: "Chest",
      copy: "Around the fullest part, tape level under the arms, arms down.",
      art: <ChestArt />,
    },
    {
      title: "Waist",
      copy: "At the natural crease when you bend sideways — not at the belt.",
      art: <WaistArt />,
    },
    {
      title: "Hips",
      copy: "Around the widest point, feet together, tape parallel to the floor.",
      art: <HipsArt />,
    },
  ];

  return (
    <section className="mt-12">
      <h3 className="label text-charcoal">How to measure</h3>
      <ul className="mt-6 grid gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.title}>
            <div className="grid h-32 place-items-center border border-hairline bg-paper">
              {step.art}
            </div>
            <h4 className="label mt-4 text-ink">{step.title}</h4>
            <p className="mt-2 text-body leading-relaxed text-charcoal">
              {step.copy}
            </p>
          </li>
        ))}
      </ul>

      <p className="label mt-8 text-charcoal">
        Between two sizes? Take the larger — our cuts are close, not tight.
      </p>
    </section>
  );
}

/** Shared torso outline; the purple thread marks where the tape sits. */
function Figure({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 80 110" aria-hidden="true" className="h-24 w-auto" fill="none">
      <g stroke="var(--ink)" strokeWidth="1" strokeLinejoin="round">
        <circle cx="40" cy="16" r="9" />
        <path d="M40 25v6M24 37c0-3 7-6 16-6s16 3 16 6l3 26H21l3-26Z" />
        <path d="M24 37 14 52M56 37l10 15" strokeLinecap="round" />
        <path d="M26 63l-3 40M54 63l3 40" strokeLinecap="round" />
      </g>
      {children}
    </svg>
  );
}

function ChestArt() {
  return (
    <Figure>
      <ellipse
        cx="40"
        cy="45"
        rx="17"
        ry="4.5"
        stroke="var(--purple-500)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </Figure>
  );
}

function WaistArt() {
  return (
    <Figure>
      <ellipse
        cx="40"
        cy="57"
        rx="15"
        ry="4"
        stroke="var(--purple-500)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </Figure>
  );
}

function HipsArt() {
  return (
    <Figure>
      <ellipse
        cx="40"
        cy="68"
        rx="18"
        ry="4.5"
        stroke="var(--purple-500)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </Figure>
  );
}
