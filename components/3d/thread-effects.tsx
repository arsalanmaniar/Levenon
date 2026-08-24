"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

/**
 * Subtle bloom for the dark signature section only.
 *
 * Loaded in its own chunk and mounted exclusively on capable devices: the
 * paper sections deliberately get their glow from contact shadows instead, so
 * a light background never blooms into mush. SKILL.md §5.
 */
export default function ThreadEffects() {
  return (
    // multisampling 0 would leave the hairline thread with no antialiasing at
    // all: once a composer is mounted the canvas's own `antialias` flag never
    // touches scene geometry. 4 is enough for a 1px line, half the library
    // default of 8.
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.45}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
    </EffectComposer>
  );
}
