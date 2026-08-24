"use client";

import { Leva, useControls } from "leva";
import { useEffect } from "react";
import type { SceneTuning } from "./scene-tuning";

/**
 * The Leva panel, and the ONLY file in the project that imports `leva`.
 *
 * This file is never imported directly — `thread-scene.tsx` reaches it
 * exclusively through `next/dynamic(() => import("./scene-controls"), …)`
 * inside a branch gated on `process.env.NODE_ENV === "development"`. Next
 * inlines `NODE_ENV` as a literal at build time, so in a production build
 * that branch is `false && …`, and Terser drops both the JSX and the dynamic
 * `import()` call as unreachable — verified after building, by grepping the
 * compiled chunks for the string `leva` (see the Batch checkpoint in
 * Levenon-Project-Spec.md for the actual result).
 *
 * Reports values up via `onChange` rather than being read directly, so the
 * scene that consumes them (`ThreadSculpture`) never needs to know whether
 * Leva exists at all — in production it just keeps using `DEFAULT_TUNING`.
 *
 * Two instances of this component mount on a page with both scenes visible
 * (hero and atelier), each calling `useControls(label, …)`. Both target
 * Leva's implicit default store — that is what makes a single call to
 * `useControls` with no store argument mean "the global panel" — so the two
 * calls contribute two *folders* to one panel rather than two panels. Only
 * the hero instance actually renders `<Leva/>`: it is always mounted first,
 * and rendering the panel component a second time (from the atelier
 * instance, once it scrolls into view) would just draw two overlapping
 * copies of the same UI.
 */
export default function SceneControls({
  label,
  onChange,
}: {
  /** "Hero" or "Atelier" — keeps the two panels apart when both are mounted. */
  label: string;
  onChange: (tuning: SceneTuning) => void;
}) {
  // The lightformer folder that used to sit here went with the hero
  // Environment rig it tuned — see scene-tuning.ts.
  const values = useControls(label, {
    floatSpeed: { value: 0.8, min: 0, max: 3, step: 0.05 },
    rotationIntensity: { value: 0.3, min: 0, max: 2, step: 0.05 },
    floatIntensity: { value: 0.4, min: 0, max: 2, step: 0.05 },
  });

  // Leva re-renders this component on every drag; lifting the value out via
  // an effect (rather than returning it) means the parent's state only
  // updates when a control has genuinely changed.
  useEffect(() => {
    onChange(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.floatSpeed, values.rotationIntensity, values.floatIntensity]);

  return label === "Hero" ? (
    <Leva titleBar={{ title: "Levenon — scene tuning (dev only)" }} />
  ) : null;
}
