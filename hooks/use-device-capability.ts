"use client";

import { useEffect, useState } from "react";

/**
 * `high`    — desktop-class: full scene, higher DPR, contact shadows, bloom.
 * `capable` — a phone that measured well enough for a lightweight 3D scene.
 * `low`     — render the SVG fallback; no WebGL context is ever created.
 * `none`    — no usable WebGL at all.
 */
export type DeviceTier = "unknown" | "high" | "capable" | "low" | "none";

export type DeviceCapability = {
  tier: DeviceTier;
  /** Fine pointer present, i.e. mouse-driven interaction is meaningful. */
  hasFinePointer: boolean;
  /** Resolved once on the client; false during SSR and first paint. */
  ready: boolean;
};

const INITIAL: DeviceCapability = {
  tier: "unknown",
  hasFinePointer: false,
  ready: false,
};

/**
 * Thresholds for letting a phone run WebGL at all — raised past the
 * conventional "6 cores / 6GB" starting point after measurement, not as a
 * guess.
 *
 * Testing this gate at its boundary with `Emulation.setCPUThrottlingRate`
 * (literal real-time throttling, not Lighthouse's estimated "simulate" mode)
 * found the WebGL bundle costs 6–7 seconds of blocking time on a phone-class
 * profile *regardless of whether it reports 6 cores/6GB or 8 cores/8GB* — the
 * two measured within noise of each other. That is the expected result:
 * `hardwareConcurrency` and `deviceMemory` describe parallelism and RAM
 * headroom, neither of which speeds up the single main thread parsing and
 * evaluating one ~217KB script. Raising the numeric bar further was tried and
 * does not fix this class of cost.
 *
 * What the bar still legitimately screens for is a phone whose *silicon* is
 * closer to desktop-class than to the low end — which correlates with, even
 * if it does not guarantee, faster single-thread throughput. 8/8 is set at
 * the ceiling of realistic current phone-class hardware rather than a value
 * chosen to make the gate easy to clear.
 */
const MIN_CORES_FOR_MOBILE_3D = 8;
const MIN_MEMORY_GB_FOR_MOBILE_3D = 8;

/**
 * Minimum acceptable connection quality, via the Network Information API.
 *
 * A slow or metered connection compounds the cost above: the ~217KB bundle
 * takes measurably longer to arrive before evaluation can even begin. This is
 * Chromium-only and frequently absent (Safari and Firefox do not implement
 * it) — absence is treated as "unproven", the same rule `deviceMemory`
 * already follows, not as a pass.
 *
 * Set well above a merely-acceptable connection (5 Mbps), not because the
 * bundle needs more bandwidth than that, but because `navigator.connection
 * .downlink` measured genuinely unreliable under CDP-simulated throttling
 * during testing — it read the real host's actual interface speed rather
 * than the throttle profile applied for the test, and (rarely) read an
 * optimistic value in the first seconds after a fresh page load before
 * Chrome's own network-quality estimator has enough samples. A false pass
 * here is what lets a phone into the expensive path, so the bar is set high
 * enough that estimator noise in that range is very unlikely to cross it.
 */
const MIN_DOWNLINK_MBPS_FOR_MOBILE_3D = 10;

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // Release the probe context immediately — browsers cap live contexts.
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Capability probe deciding how much 3D to render.
 *
 * Progressive enhancement, not feature detection theatre: the default answer is
 * the cheap one, and a device has to actively demonstrate headroom to be moved
 * up. Anything uncertain resolves downward.
 *
 * The mobile tier exists because profiling showed the WebGL stack was ~217 KiB
 * and roughly 1.4 s of script evaluation on a throttled phone — the largest
 * controllable cost on the page. Rather than ship that to every handset or none
 * of them, a phone now has to clear a CPU and memory bar first.
 */
export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>(INITIAL);

  useEffect(() => {
    if (!detectWebGL()) {
      setCapability({ tier: "none", hasFinePointer: false, ready: true });
      return;
    }

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
        downlink?: number;
      };
    };

    const cores = nav.hardwareConcurrency ?? 4;
    /*
     * `deviceMemory` is Chromium-only. Absent must mean "no signal", not
     * "4 GB" — defaulting to the threshold value itself would demote every
     * Safari and Firefox visitor on a property they never reported. For the
     * *desktop* decision below, absence stays generous (8); for the stricter
     * mobile gate it is handled separately, where absence is treated as
     * "unproven" rather than "passing".
     */
    const reportedMemory = nav.deviceMemory;
    const memory = reportedMemory ?? 8;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const smallViewport = window.matchMedia("(max-width: 767px)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Save-Data is the user asking for less. Honour it before anything else.
    const saveData = nav.connection?.saveData === true;

    const isPhone = !finePointer && smallViewport;
    const weakHardware = cores <= 4 || memory <= 4;

    let tier: DeviceTier;

    if (!isPhone && !weakHardware) {
      tier = "high";
    } else if (isPhone && !saveData && !reducedMotion) {
      /*
       * A phone earns 3D only by clearing every bar at once. `deviceMemory`
       * absent counts as *not cleared* here — the point of this tier is proven
       * headroom, and a browser that reports nothing has proven nothing.
       */
      const enoughCores = cores >= MIN_CORES_FOR_MOBILE_3D;
      const enoughMemory =
        typeof reportedMemory === "number" &&
        reportedMemory >= MIN_MEMORY_GB_FOR_MOBILE_3D;
      const connection = nav.connection;
      const enoughBandwidth =
        typeof connection?.downlink === "number" &&
        connection.downlink >= MIN_DOWNLINK_MBPS_FOR_MOBILE_3D &&
        connection.effectiveType === "4g";
      tier =
        enoughCores && enoughMemory && enoughBandwidth ? "capable" : "low";
    } else {
      tier = "low";
    }

    setCapability({ tier, hasFinePointer: finePointer, ready: true });
  }, []);

  return capability;
}
