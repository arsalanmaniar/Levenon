"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, TubeGeometry, Vector3, MathUtils, type Group, type Mesh } from "three";
import { ContactShadows, Float } from "@react-three/drei";
// `Environment`/`RoomEnvironment` are deliberately not imported — see the
// removal note below, where the hero's environment-map attempt used to be.
// `ThreadMotes` is intentionally no longer imported — see the removal note
// beside the ContactShadows block below. The component file is kept.
import { DEFAULT_TUNING, type SceneTuning } from "./scene-tuning";
import type { PointerTarget } from "@/hooks/use-window-pointer";

export type SculptureVariant = "light" | "dark";

type ThreadSculptureProps = {
  variant: SculptureVariant;
  /** Live pointer, read per-frame. Never causes a React render. */
  pointer: React.MutableRefObject<PointerTarget>;
  /** false → single static frame: no idle rotation, no pointer reaction. */
  animate: boolean;
  /** false → reduced geometry, no contact shadow, no rim light, no motes. */
  detailed: boolean;
  /**
   * Reads a 0→1 scroll progress published by CSS (`--atelier-progress`).
   * Only supplied for the dark section; the hero does not drift. This is
   * also the structural signal for "which instance is this" used below —
   * `variant` itself no longer carries that meaning, since Batch (theme)
   * flips it to track whichever ground colour this instance is actually
   * rendering on, and that colour swaps between the two instances when the
   * theme does.
   */
  readProgress?: () => number;
  /** Leva-tunable values in development; `DEFAULT_TUNING` in production. */
  tuning?: SceneTuning;
};

/**
 * Fixed material recipe for the loop — no per-variant ramp.
 *
 * `meshLambertMaterial` again, per an explicit constraint against
 * `meshStandardMaterial`/`meshPhysicalMaterial` and against anything that
 * depends on an environment map (see the 2026-08-24 spec entries for the
 * full history of both). This round's fix is not the material — it's the
 * geometry and the lighting angle. A Lambertian surface only ever shows a
 * light/dark gradient where the light itself is off-axis from the camera;
 * the previous rig's near-frontal key light was starving that gradient
 * regardless of what the material was. See the lighting rig below.
 */
const MATERIAL_COLOR = "#7C2AE8";
const MATERIAL_EMISSIVE = "#3D0E8A";
const MATERIAL_EMISSIVE_INTENSITY = 0.08;

/** Tint for the mote field and the floor glow only — unrelated to the loop material above. */
const THREAD_COLOR: Record<SculptureVariant, string> = {
  light: "#7C2AE8",
  dark: "#B98CF2",
};

// Max tilt the pointer can induce, in radians (~11°). The sculpture leans
// toward the cursor; it never whips around to face it.
const TILT_X = 0.2;
const TILT_Y = 0.28;

// Scroll drift, dark section only: the camera closes half a unit and the
// sculpture turns ~5° as the section comes up the page.
const DRIFT_Z = 0.5;
const DRIFT_YAW = MathUtils.degToRad(5);
// Must match the Canvas's initial camera z in thread-scene.tsx (fov 38 there
// too — the two are a matched pair). Widened from 34° to 38° alongside this
// move: a touch more perspective foreshortening reads as more three-
// dimensional than a narrow, near-telephoto fov does, which was flattening
// the sense of depth independent of the geometry/lighting fix below.
const BASE_Z = 7;

/**
 * 0.75, sized against the new loop geometry's own bounding radius (~1.3
 * world units: control points sit at radius ~1.1–1.15, tube adds 0.17) to
 * land the sculpture at roughly 40% of the canvas's vertical extent at
 * `BASE_Z = 7`, `fov = 38` — the middle of the 35–45% target for how much of
 * the hero's visual area the object should occupy. Worked out from
 * `2 × boundingRadius × scale ≈ 0.40 × 2 × (z·tan(fov/2))`, not eyeballed;
 * shown here so the next pass can correct the arithmetic rather than the
 * number blind. Left uniform across both instances, matching every previous
 * pass's own reasoning for doing so.
 */
const SCALE = { hero: 0.75, atelier: 0.75 } as const;

/**
 * The loop's own path — a single asymmetric ring with real depth variation,
 * not a flat circle traced in 3D. This is the actual fix for "reads like an
 * icon": a `TorusKnotGeometry`'s p/q winding produces a dense, mostly-planar,
 * self-overlapping silhouette that looks graphic from most angles regardless
 * of lighting. A single open loop has one continuous, readable surface, clear
 * negative space through the middle, and — because these nine points don't
 * sit on one flat plane — a front/back curvature that a raking light can
 * actually model.
 *
 * It is also, deliberately, the brand's own mark: an open ring, the same
 * motif as the wordmark's "e". A torus knot had no connection to Levenon's
 * actual identity; this shape is built to BE it, at sculptural scale — the
 * brief's own ask ("designed specifically for Levenon"), not a generic
 * primitive picked for reliability and left unexamined.
 *
 * Built once at module scope, not per-render: the curve and the geometry it
 * produces are both static, so there is nothing to memoize and nothing to
 * dispose — nothing here is ever recreated. `TubeGeometry` computes its own
 * Frenet-frame vertex normals in its constructor; calling
 * `computeVertexNormals()` on top would overwrite those with flatter,
 * per-face-averaged ones, so it deliberately isn't called. Segment counts
 * (120 tubular × 12 radial ≈ 1,440 vertices) are fixed rather than
 * `detailed`-branched like the old thread path was — a loop this simple is
 * cheap enough on any tier that WebGL runs on at all; the old segment
 * ladder existed for a much longer, twistier custom curve that no longer
 * exists.
 */
/*
 * Generated on a circle rather than hand-typed as nine loose coordinates.
 *
 * The hand-typed version (first attempt) produced a visibly lumpy,
 * asymmetric silhouette — screenshotted, it read as a bent blob rather than
 * a designed object, because freehand coordinates don't hold a consistent
 * radius and the eye reads that unevenness as a mistake rather than as
 * intent. Deriving the ring from a circle guarantees an even, elegant
 * silhouette; the character comes from two controlled modulations applied
 * *on top* of that regular base:
 *
 *   - `z` follows a two-cycle sine, so the ring lifts toward the viewer at
 *     two opposite points and away at the other two — this is what gives the
 *     raking key light a front/back surface to model, and what keeps it from
 *     reading as a flat washer.
 *   - the radius breathes by ±6% on a three-cycle sine, so the loop is not a
 *     mechanically perfect donut. Small on purpose: enough to look
 *     hand-formed, not enough to look wobbly.
 *
 * Twelve samples is the sweet spot — enough for the modulations to read,
 * few enough that the Catmull-Rom stays taut between them.
 */
const LOOP_POINTS: Vector3[] = Array.from({ length: 12 }, (_, index) => {
  const t = (index / 12) * Math.PI * 2;
  const radius = 1.12 * (1 + 0.06 * Math.sin(t * 3));
  return new Vector3(
    Math.cos(t) * radius,
    Math.sin(t) * radius,
    Math.sin(t * 2) * 0.34,
  );
});

const LOOP_CURVE = new CatmullRomCurve3(LOOP_POINTS, true, "catmullrom", 0.5);
const LOOP_GEOMETRY = new TubeGeometry(LOOP_CURVE, 160, 0.19, 16, true);

/**
 * Wraps its children in drei's `<Float>` whenever motion is allowed — now
 * shared by both the hero and the atelier instance (previously atelier
 * only), for the "slight floating movement" the brief asks for everywhere,
 * not just the dark section.
 *
 * Kept as a real conditional-component rather than passing a `speed={0}` or
 * similar zeroed-out prop into an always-mounted `<Float>`: drei's `Float`
 * still runs its own `useFrame` and does the sin-wave maths every frame even
 * at speed 0, so "disabled" has to mean "not mounted", not "mounted but
 * quiet" — the same distinction the rest of this codebase draws for
 * `prefers-reduced-motion` everywhere else (never construct the animation,
 * rather than construct it at zero).
 */
function FloatWrapper({
  enabled,
  speed,
  rotationIntensity,
  floatIntensity,
  children,
}: {
  enabled: boolean;
  speed: number;
  rotationIntensity: number;
  floatIntensity: number;
  children: React.ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <Float speed={speed} rotationIntensity={rotationIntensity} floatIntensity={floatIntensity}>
      {children}
    </Float>
  );
}

/**
 * The thread loop — the brand's "e" ring as a continuous 3D ribbon.
 *
 * Two groups on purpose: the outer one carries the damped pointer lean, the
 * inner mesh carries the slow idle spin, so the two never fight over the same
 * rotation channel.
 */
export function ThreadSculpture({
  variant,
  pointer,
  animate,
  detailed,
  readProgress,
  tuning = DEFAULT_TUNING,
}: ThreadSculptureProps) {
  // The one place "which instance is this" is asked directly, rather than
  // inferred from the (theme-flipped) colour variant.
  const isAtelier = !!readProgress;
  const leanRef = useRef<Group>(null);
  const knotRef = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);

  const color = THREAD_COLOR[variant];

  /*
   * The sculpture is framed against the canvas's *vertical* extent (an R3F
   * camera's `fov` is vertical), so a short phone-height canvas renders it
   * proportionally small in absolute pixels: measured at 390×260, the loop
   * came out roughly 96px tall — about 37% of the slot, with the rest
   * reading as empty canvas. That is the "oversized empty canvas" the art
   * direction explicitly rules out on mobile.
   *
   * Scaling up on short canvases rather than pulling the camera in keeps
   * `BASE_Z` — which the atelier's scroll drift damps toward — untouched,
   * so this cannot desynchronise from `thread-scene.tsx`'s Canvas camera
   * prop. `size` comes from R3F and updates on resize, so rotating a phone
   * re-evaluates it. Checked against the frustum at that aspect: the wider
   * loop still occupies only ~41% of the canvas width, so it does not clip.
   */
  const canvasHeight = useThree((state) => state.size.height);
  const compact = canvasHeight < 320;
  const scale = (isAtelier ? SCALE.atelier : SCALE.hero) * (compact ? 1.5 : 1);

  useFrame((state, delta) => {
    // The drift target still has to settle on the first static frame, so
    // reduced motion parks the camera at rest rather than skipping the block.
    const dt = Math.min(delta, 0.1);

    if (readProgress) {
      const progress = animate ? readProgress() : 0;
      // Damped rather than assigned: `--atelier-progress` steps discretely on
      // browsers that support scroll timelines but not registered @property,
      // and damping turns that staircase into a glide instead of a snap.
      camera.position.z = MathUtils.damp(
        camera.position.z,
        BASE_Z - progress * DRIFT_Z,
        3,
        dt,
      );
    }

    if (!animate) return;

    const lean = leanRef.current;
    if (lean) {
      const yaw = readProgress ? readProgress() * DRIFT_YAW : 0;
      lean.rotation.x = MathUtils.damp(
        lean.rotation.x,
        -pointer.current.y * TILT_X,
        3,
        dt,
      );
      lean.rotation.y = MathUtils.damp(
        lean.rotation.y,
        pointer.current.x * TILT_Y + yaw,
        3,
        dt,
      );
    }

    // Extremely slow — a full turn takes roughly ninety seconds. Fast idle
    // rotation is what "looks cheap" (spinner, not sculpture); this should
    // read as barely perceptible, closer to breathing than spinning.
    if (knotRef.current) {
      knotRef.current.rotation.y += 0.0015;
      knotRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
    }
  });

  return (
    <>
      {/*
        Studio three-light rig (2026-08-24, fourth pass): ambient fill kept
        deliberately low so it never flattens the shading, one strong key
        light raking in from upper-left-front — off-axis from the camera on
        purpose, since a Lambertian surface only shows a light/dark gradient
        where the light direction actually differs from the view direction —
        a lower-intensity fill from the opposite side so the shadow side
        never crushes to pure black, and one subtle purple point light
        behind/aside for a rim. No `hemisphereLight`, no `Environment`, no
        `RoomEnvironment` — still avoided, per the standing constraint (see
        the 2026-08-24 nuclear-fix entry in Levenon-Project-Spec.md for the
        CPU-throttle hang that ruled the last two of those out).
      */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[-4, 6, 5]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[4, -3, -4]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-2, 0, -5]} intensity={1.4} color="#B98CF2" distance={12} decay={2} />

      <group ref={leanRef} scale={scale}>
        <FloatWrapper
          enabled={animate}
          speed={tuning.floatSpeed}
          rotationIntensity={tuning.rotationIntensity}
          floatIntensity={tuning.floatIntensity}
        >
          <mesh ref={knotRef} geometry={LOOP_GEOMETRY} rotation={[0.3, 0.5, 0.1]}>
            <meshLambertMaterial
              color={MATERIAL_COLOR}
              emissive={MATERIAL_EMISSIVE}
              emissiveIntensity={MATERIAL_EMISSIVE_INTENSITY}
              flatShading={false}
            />
          </mesh>
        </FloatWrapper>
      </group>

      {/*
        The mote field is removed (2026-08-24, Phase 9/10).

        Two independent reasons, both checked rather than assumed:

        - Design: screenshotted at real size the dashes read as dust
          specks scattered around the sculpture, not as "loose threads in
          the air" — visual noise around the one object the hero is meant
          to make you look at. The brief for this pass explicitly rules out
          random particles, and SKILL.md §5's own framing of form 5 ("the
          thread never becomes a particle cloud for its own sake") is
          closer to an argument against this instance than for it.
        - Cost: `ThreadMotes` composes 120 instance matrices inside
          `useFrame`, i.e. continuous main-thread work on every frame for
          the entire time the hero is on screen. With Total Blocking Time
          the weakest metric on this page, deleting recurring main-thread
          work with no design case behind it is the cheapest real win
          available.

        `ThreadMotes` itself is left in the tree (unused) rather than
        deleted — it is a documented SKILL.md motif form and re-mounting it
        is a one-line change if the owner disagrees with this call.
      */}

      {detailed && variant === "light" && (
        // The soft purple glow the sculpture casts on the floor.
        //
        // Light sections only: a contact shadow is by definition darker than
        // its ground, so on ink it renders as a glowing rectangle instead of a
        // shadow. The dark section gets its glow from bloom instead.
        <ContactShadows
          position={[0, -1.55, 0]}
          scale={9.5}
          opacity={0.55}
          blur={3.2}
          far={3.4}
          resolution={256}
          color={color}
        />
      )}
    </>
  );
}
