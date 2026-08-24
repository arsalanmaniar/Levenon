"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { ThreadSculpture, type SculptureVariant } from "./thread-sculpture";
import { StaticThread } from "./static-thread";
import { DEFAULT_TUNING, type SceneTuning } from "./scene-tuning";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { useWindowPointer } from "@/hooks/use-window-pointer";

// Postprocessing is a separate chunk, fetched only when a capable device
// actually reaches the dark section.
const ThreadEffects = dynamic(() => import("./thread-effects"), { ssr: false });

/*
 * The Leva panel.
 *
 * **The guarantee that actually holds lives in `next.config.mjs`**, which
 * aliases the `leva` package to `false` for production builds — that runs as
 * plain Node.js before webpack ever opens a file, so leva's own code is
 * never parsed into any chunk, full stop.
 *
 * The `IS_DEV ? dynamic(() => import(...)) : () => null` below is kept as a
 * second, independent line of defence, but on its own it was NOT enough:
 * an earlier version only gated *rendering* SceneControls behind
 * `IS_DEV && <SceneControls/>`, and `next/dynamic`'s `import()` is a
 * webpack code-splitting boundary registered when this module loads, not
 * when the component renders — gating the JSX did not stop webpack
 * registering the chunk, and leva's own error strings ("LEVA: …",
 * "LEVA_ERROR") still turned up in a real, hashed production chunk after
 * building. Moving the `dynamic()` call itself inside the ternary did not
 * fix that either — confirmed the same way, by grepping the actual
 * `.next` output. Only the config-level alias made the strings disappear.
 * See the Batch checkpoint in Levenon-Project-Spec.md for the full trail.
 */
const IS_DEV = process.env.NODE_ENV === "development";
const SceneControls = IS_DEV
  ? dynamic(() => import("./scene-controls"), { ssr: false })
  : () => null;

export type ThreadSceneProps = {
  variant?: SculptureVariant;
  /** false → the section is off screen: park the render loop entirely. */
  active?: boolean;
  /**
   * Reads the 0→1 scroll progress CSS publishes on `--atelier-progress`.
   * Passed down from the canvas host, which owns the DOM node it lives on.
   */
  readProgress?: () => number;
};

/**
 * R3F drives one global rAF loop for every root on the page and stops it as
 * soon as no root wants a frame. Coming back from `frameloop="never"` therefore
 * needs an explicit nudge, or the canvas stays frozen on the frame it parked
 * on. The rAF defers past the Canvas's own layout effect, so the new frameloop
 * value is already in the store when invalidate() runs.
 */
function LoopResume({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [active, invalidate]);

  return null;
}

/**
 * The <Canvas> host. Reached only through thread-canvas.tsx's dynamic import,
 * so three.js never lands in the initial bundle.
 *
 * Degradation ladder:
 *   no WebGL / context lost  → StaticThread (SVG)
 *   low-tier device          → simplified geometry, dpr 1, no shadows, no bloom
 *   prefers-reduced-motion   → frameloop "demand": exactly one frame, no motion
 *   scrolled off screen      → frameloop "never": zero GPU and zero main-thread
 */
export default function ThreadScene({
  variant = "light",
  active = true,
  readProgress,
}: ThreadSceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { tier, hasFinePointer, ready } = useDeviceCapability();
  const [contextLost, setContextLost] = useState(false);
  const [tuning, setTuning] = useState<SceneTuning>(DEFAULT_TUNING);

  const animate = !reducedMotion;
  /*
   * `detailed` is the desktop-class budget: contact shadows, higher DPR, and
   * (in the atelier) the bloom pass. A `capable` phone runs the same sculpture
   * — same geometry, same material, same lighting rig, so the brand identity
   * is identical — but without those three extras, which are the expensive
   * ones. It is a quality reduction, never a different object.
   */
  const detailed = tier === "high";
  // Bloom is the only postprocessing pass, and it only ever mounts here.
  const composed = variant === "dark" && detailed;
  const pointer = useWindowPointer(active && animate && hasFinePointer);

  const handleCreated = useCallback(
    ({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
      gl.domElement.addEventListener(
        "webglcontextlost",
        (event) => {
          // Do not preventDefault: we are not attempting restore, we swap to
          // the static fallback so the section never renders as a blank hole.
          event.stopPropagation();
          setContextLost(true);
        },
        { once: true },
      );
    },
    [],
  );

  // Hold the SVG until the probe has run, so we never spin up a WebGL context
  // on a device that cannot afford one.
  if (!ready || tier === "none" || contextLost) {
    return <StaticThread />;
  }

  return (
    <>
      <Canvas
        aria-hidden="true"
        tabIndex={-1}
        className="touch-none"
        dpr={detailed ? [1, 1.75] : 1}
        // "demand" renders a single frame at mount and on resize — that is the
        // reduced-motion still, without needing a separate code path.
        // "never" parks a canvas the user has scrolled away from.
        frameloop={!active ? "never" : animate ? "always" : "demand"}
        // z and fov match thread-sculpture.tsx's BASE_Z/scale calibration —
        // keep all three in sync; see that file's SCALE comment for the math.
        camera={{ position: [0, 0.3, 7], fov: 38 }}
        gl={{
          alpha: true,
          // With a composer the scene is drawn into an offscreen buffer, so
          // the default framebuffer only ever receives full-screen quads: a
          // multisampled backbuffer would be allocated and resolved for
          // nothing. AA for that path comes from EffectComposer's own MSAA
          // instead.
          antialias: detailed && !composed,
          powerPreference: "high-performance",
        }}
        onCreated={handleCreated}
      >
        <LoopResume active={active} />
        <Suspense fallback={null}>
          <ThreadSculpture
            variant={variant}
            pointer={pointer}
            animate={animate}
            detailed={detailed}
            readProgress={readProgress}
            tuning={tuning}
          />
          {composed && <ThreadEffects />}
        </Suspense>
      </Canvas>
      {/*
        Outside <Canvas> deliberately: R3F's children run through its own
        Three.js-only reconciler, which cannot render a DOM panel. Leva's
        `<Leva/>` is plain HTML, so it has to sit here, as a sibling, not
        inside the tree above.
      */}
      {IS_DEV && (
        <SceneControls
          label={readProgress ? "Atelier" : "Hero"}
          onChange={setTuning}
        />
      )}
    </>
  );
}
