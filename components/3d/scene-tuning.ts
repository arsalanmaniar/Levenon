/**
 * The values Leva can tune, and what they default to when Leva is absent
 * (which is always, in production).
 *
 * Split out from `scene-controls.tsx` so `thread-sculpture.tsx` can import
 * the type and the defaults without ever importing `leva` itself.
 *
 * Started life with three more fields here — `keyIntensity`, `fillIntensity`,
 * `rimIntensity` — for a hero `Environment`/`Lightformer` rig that was built,
 * measured, and removed for hanging the page under CPU throttle (see the
 * removal note in `thread-sculpture.tsx`). They went with it: a Leva slider
 * for a value nothing reads is worse than no slider.
 */
export type SceneTuning = {
  floatSpeed: number;
  rotationIntensity: number;
  floatIntensity: number;
};

export const DEFAULT_TUNING: SceneTuning = {
  floatSpeed: 0.8,
  rotationIntensity: 0.3,
  floatIntensity: 0.4,
};
