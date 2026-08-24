"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import type { PointerTarget } from "@/hooks/use-window-pointer";

/**
 * Loose stitches suspended in the air around the sculpture.
 *
 * **Not a particle cloud.** SKILL.md §5 rules out particle systems for their
 * own sake, and round sprites drifting in space are exactly the cliché it is
 * guarding against. These are short *dashes* — the stitch, the motif's second
 * permitted form, rendered in 3D — at a size where they read as thread ends
 * caught in the light rather than as stars. Capped at 120 and drawn as a single
 * `InstancedMesh`, so the whole field is **one draw call**.
 *
 * Owner override noted in the spec: the skill's §5 list should be widened to
 * cover this, or the field should go. It is on the Batch G amendment list.
 */

const COUNT = 120;

/** Half-extent of the slab the motes live in. */
const SPREAD_X = 3.1;
const SPREAD_Y = 2.0;
const SPREAD_Z = 1.4;

/** Pointer influence radius in world units, and its square (the only one used). */
const REACH = 0.9;
const REACH_SQ = REACH * REACH;

/** How far a mote is pushed at the centre of the cursor. */
const PUSH = 0.55;

type ThreadMotesProps = {
  color: string;
  pointer: React.MutableRefObject<PointerTarget>;
  /** false → placed once and left alone. No drift, no pointer reaction. */
  animate: boolean;
};

export function ThreadMotes({ color, pointer, animate }: ThreadMotesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const { viewport } = useThree();

  // Per-mote constants, generated once. Flat typed arrays rather than an array
  // of objects: this is read 120 times a frame and the layout matters.
  const seed = useMemo(() => {
    const base = new Float32Array(COUNT * 3);
    const phase = new Float32Array(COUNT * 3);
    const spin = new Float32Array(COUNT * 3);
    const rate = new Float32Array(COUNT);
    // Deterministic: a fixed LCG rather than Math.random, so the field is
    // identical between server-side markup, hydration and any re-mount.
    let s = 0x2f6e2b1;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
    for (let i = 0; i < COUNT; i++) {
      base[i * 3] = (rand() * 2 - 1) * SPREAD_X;
      base[i * 3 + 1] = (rand() * 2 - 1) * SPREAD_Y;
      base[i * 3 + 2] = (rand() * 2 - 1) * SPREAD_Z;
      phase[i * 3] = rand() * Math.PI * 2;
      phase[i * 3 + 1] = rand() * Math.PI * 2;
      phase[i * 3 + 2] = rand() * Math.PI * 2;
      spin[i * 3] = rand() * Math.PI;
      spin[i * 3 + 1] = rand() * Math.PI;
      spin[i * 3 + 2] = rand() * Math.PI;
      rate[i] = 0.08 + rand() * 0.12;
    }
    return { base, phase, spin, rate };
  }, []);

  // Live displacement away from the cursor, eased back toward zero.
  const push = useMemo(() => new Float32Array(COUNT * 2), []);

  const place = (elapsed: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { base, phase, spin, rate } = seed;
    const cursorX = (pointer.current.x * viewport.width) / 2;
    const cursorY = (pointer.current.y * viewport.height) / 2;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const drift = elapsed * rate[i];

      const x = base[i3] + Math.sin(drift + phase[i3]) * 0.16;
      const y = base[i3 + 1] + Math.cos(drift * 0.8 + phase[i3 + 1]) * 0.13;
      const z = base[i3 + 2] + Math.sin(drift * 0.6 + phase[i3 + 2]) * 0.1;

      const i2 = i * 2;
      const dx = x - cursorX;
      const dy = y - cursorY;

      /*
       * Spatial reject, cheapest test first.
       *
       * Two axis-aligned comparisons throw out every mote outside the cursor's
       * bounding square before any multiplication happens; the square-distance
       * test only runs for the handful left. Nothing here calls `sqrt` — the
       * falloff is computed from d² directly, which also removes the
       * divide-by-zero at the exact cursor position that normalising would
       * introduce. A spatial hash would be *slower* at this count: rebuilding
       * buckets for 120 drifting motes costs more than 240 subtractions.
       */
      if (dx < REACH && dx > -REACH && dy < REACH && dy > -REACH) {
        const d2 = dx * dx + dy * dy;
        if (d2 < REACH_SQ) {
          const falloff = (1 - d2 / REACH_SQ) * PUSH;
          push[i2] += (dx * falloff - push[i2]) * 0.12;
          push[i2 + 1] += (dy * falloff - push[i2 + 1]) * 0.12;
        }
      }
      // Ease home whether or not it was pushed this frame.
      push[i2] *= 0.94;
      push[i2 + 1] *= 0.94;

      dummy.position.set(x + push[i2], y + push[i2 + 1], z);
      dummy.rotation.set(spin[i3], spin[i3 + 1] + drift * 0.3, spin[i3 + 2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  };

  // One static placement for the reduced-motion / parked case. Without this the
  // field would render 120 stacked instances at the origin.
  useEffect(() => {
    place(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height]);

  useFrame((state) => {
    if (!animate) return;
    place(state.clock.elapsedTime);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      {/* A dash, not a dot: long in X, hairline in the other two axes. */}
      <boxGeometry args={[0.05, 0.006, 0.006]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
