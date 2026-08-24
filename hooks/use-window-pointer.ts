"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export type PointerTarget = { x: number; y: number };

/**
 * Normalised (-1..1) pointer position tracked on `window`.
 *
 * Returned as a ref, never state: the 3D scene reads it inside `useFrame`, so a
 * re-render per mousemove would be pure waste. Listening on the window (rather
 * than the canvas) means the sculpture still reacts while the pointer is over
 * the headline that sits on top of it.
 *
 * Stays at rest when `enabled` is false — reduced motion or coarse pointer.
 */
export function useWindowPointer(enabled: boolean): MutableRefObject<PointerTarget> {
  const pointer = useRef<PointerTarget>({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      pointer.current.x = 0;
      pointer.current.y = 0;
      return;
    }

    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return pointer;
}
