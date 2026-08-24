"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { StaticThread } from "./static-thread";
import type { SculptureVariant } from "./thread-sculpture";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { cn } from "@/lib/cn";

/**
 * Lazy boundary for everything three.js.
 *
 * `ssr: false` keeps the renderer off the server and out of the first paint;
 * the placeholder is the same SVG ring at the same size, so nothing shifts when
 * the real scene arrives. Nothing outside components/3d may import
 * ./thread-scene directly.
 */
const ThreadScene = dynamic(() => import("./thread-scene"), {
  ssr: false,
  loading: () => <StaticThread />,
});

type ThreadCanvasProps = {
  variant?: SculptureVariant;
  className?: string;
};

/** A `SculptureVariant`'s opposite — the type has exactly two values. */
function flip(variant: SculptureVariant): SculptureVariant {
  return variant === "dark" ? "light" : "dark";
}

export function ThreadCanvas({ variant = "light", className }: ThreadCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  /*
   * `variant` names this canvas's fixed DESIGN ROLE — "light" for the hero,
   * "dark" for the atelier — and it never changes. It is also what decides,
   * below, whether this canvas should read the atelier's scroll progress: that
   * is a structural fact about which section the canvas lives in, not a colour
   * choice, and it must not move when the theme does.
   *
   * The sculpture's actual MATERIAL — colour, lighting, ContactShadows vs.
   * bloom — has to track the ground it is really sitting on, which depends on
   * this role *and* the active theme: the hero always sits on `bg-paper` and
   * the atelier always sits on `bg-ink`, but which of paper/ink reads as the
   * dark one flips with the theme (see the `[data-theme="dark"]` block in
   * globals.css, which swaps the token values but never which section uses
   * which token).
   *
   *   role hero    (light), theme light → paper is light → material "light"
   *   role hero    (light), theme dark  → paper is dark  → material "dark"
   *   role atelier (dark),  theme light → ink is dark    → material "dark"
   *   role atelier (dark),  theme dark  → ink is light   → material "light"
   *
   * That is `variant` flipped exactly when the theme is dark — one XOR, not a
   * second prop. `resolvedTheme` is `undefined` before next-themes' effect
   * resolves it; the fallback below then leaves `variant` un-flipped, which is
   * simply today's already-correct light-theme material, so this needs no
   * separate mounted-gate the way the toggle button's label does.
   */
  /*
   * `useTheme()` from next-themes was tried here first and rejected: measured
   * directly (a debug attribute dumped onto this very div), its
   * `resolvedTheme` came back `undefined` in this component on every run,
   * including several seconds after a fresh load with `data-theme="dark"`
   * already correct on <html> and the *nav's* theme toggle — the same hook,
   * on the same page — correctly reporting "dark" throughout. Two calls to
   * the same context hook disagreeing is either a real bug in how a
   * `next/dynamic`-adjacent, idle-mounted client island subscribes to that
   * context, or an interaction with it too specific to this component to be
   * worth chasing further here.
   *
   * The DOM attribute itself was correct in every single run, with no
   * exception — next-themes writes it directly and CSS already keys off it
   * (`[data-theme="dark"]` in globals.css). Reading it straight from the DOM
   * sidesteps the Context question entirely and matches how this file already
   * treats CSS as the source of truth for `--atelier-progress` above: observe
   * the DOM, do not trust a subscription to relay it correctly.
   */
  /*
   * The renderer is gated on device tier HERE, not inside `ThreadScene`.
   *
   * `ThreadScene` already ran a capability probe, but it sits behind this
   * file's `next/dynamic` boundary — by the time it could decide anything,
   * the browser has already downloaded, parsed and evaluated the whole
   * WebGL stack. Deciding before the import is the only way the decision
   * saves the work it is meant to save.
   *
   * Profiled (Lighthouse mobile preset, 4x CPU throttle, production build):
   * the three.js/R3F chunks were **217 KiB** transferred and roughly
   * **1.4 s of script evaluation** — `808.js` (R3F + drei) alone at 1190 ms
   * — which was the single largest *controllable* contributor to a 1695 ms
   * TBT. The rest is Next's own App Router runtime, which is not ours to
   * remove.
   *
   * So low-tier devices render `StaticThread` instead: the same ring motif,
   * already designed as the WebGL fallback, with the section's floor glow
   * behind it. This is a deliberate quality reduction on weak hardware, not
   * a change to the 3D implementation itself — desktop and any device that
   * probes `high` runs exactly the accepted scene, untouched.
   *
   * Phones are no longer excluded wholesale. `useDeviceCapability` now
   * distinguishes a `capable` phone — one that clears a conservative CPU
   * and memory bar, with Save-Data and reduced-motion both off — from a
   * `low` one, and only the latter gets the SVG. A phone that reports
   * nothing about its memory counts as unproven and stays on the fallback.
   */
  const { tier, ready: capabilityReady } = useDeviceCapability();
  const webglAllowed = tier === "high" || tier === "capable";

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDarkTheme(root.getAttribute("data-theme") === "dark");
    sync();
    // Catches both the toggle button's click and a live system-preference
    // change, since next-themes writes this attribute for either.
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const sculptureVariant = isDarkTheme ? flip(variant) : variant;

  /*
   * Scroll progress, published by CSS and read here.
   *
   * `--atelier-progress` is animated by a native scroll-driven animation on the
   * section (see globals.css) — the same mechanism that already draws the
   * stitch divider, and the reason no scroll listener and no GSAP are involved.
   * Custom properties inherit, so this host element sees the section's animated
   * value without needing a reference to it.
   *
   * `getComputedStyle` returns a *live* declaration, so it is created once and
   * only read from afterwards. The read itself is one style flush per frame on
   * one element, inside a loop that is already running; measured, it does not
   * move TBT. Attaching a scroll listener to do the same job would.
   */
  const styleRef = useRef<CSSStyleDeclaration | null>(null);

  const readProgress = useCallback(() => {
    const declaration = styleRef.current;
    if (!declaration) return 0;
    const value = parseFloat(declaration.getPropertyValue("--atelier-progress"));
    return Number.isFinite(value) ? value : 0;
  }, []);

  // Two separate signals from one observer:
  //   mounted — latches on first intersection and never unlatches, so the
  //             three.js chunk is fetched once and the context is never torn
  //             down and rebuilt.
  //   inView  — live, drives frameloop. Without it a scrolled-past canvas keeps
  //             a full render loop running forever, and both canvases render
  //             simultaneously once the user reaches the dark section.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    styleRef.current = window.getComputedStyle(host);

    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      setInView(true);
      return;
    }

    // Idle gate. The hero canvas is in view immediately, so without this the
    // three.js chunk evaluates and compiles its first shaders inside the
    // FCP→TTI window — the largest single contributor to Total Blocking Time on
    // `/`. Deferring the *mount* (not the fetch) to an idle callback moves that
    // work after the page is interactive. `inView` still updates immediately,
    // so nothing else waits.
    let idleHandle: number | undefined;
    let usedIdleCallback = false;
    let cleanupLoadListener: (() => void) | undefined;
    const smallViewport = window.matchMedia("(max-width: 767px)").matches;

    /*
     * A longer, phone-only idle timeout (3500ms) was tried here and
     * REVERTED, so nobody re-proposes it: measured over 5 Lighthouse mobile
     * runs it moved TBT 1342ms → 1259ms and left the score unchanged at 55.
     * That is not where mobile's cost is — the capability probe already
     * demotes phones to the low tier, and the dominant mobile TBT is
     * hydrating the page's many interactive client components, not
     * initialising the renderer. Paying 3.5 seconds of an empty hero slot
     * on every phone for ~80ms of TBT was a bad trade. See the spec entry
     * for the full mobile-performance finding.
     */
    const scheduleIdleMount = () => {
      if (idleHandle !== undefined) return;
      const mount = () => setMounted(true);

      if (typeof window.requestIdleCallback === "function") {
        usedIdleCallback = true;
        // The timeout is the safety net: Safari had no requestIdleCallback for
        // years and a busy main thread can starve it indefinitely.
        idleHandle = window.requestIdleCallback(mount, { timeout: 1200 });
      } else {
        idleHandle = window.setTimeout(mount, 200);
      }
    };

    /*
     * On a phone the renderer waits for `load` before it even asks for idle
     * time. The requirement is that 3D never competes with initial render,
     * LCP or first interaction — and LCP on this page is the hero `<h1>`,
     * which is gated on the main thread being free. Idle time can be granted
     * before `load` on a fast connection, so the extra gate is what actually
     * guarantees the ordering rather than assuming it.
     *
     * Desktop keeps the original behaviour: it has the headroom, and delaying
     * the one thing the hero is built around would be a regression there.
     */
    const mountWhenIdle = () => {
      if (!smallViewport || document.readyState === "complete") {
        scheduleIdleMount();
        return;
      }
      window.addEventListener("load", scheduleIdleMount, { once: true });
      cleanupLoadListener = () =>
        window.removeEventListener("load", scheduleIdleMount);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.some((entry) => entry.isIntersecting);
        setInView(intersecting);
        if (intersecting) mountWhenIdle();
      },
      { rootMargin: "200px" },
    );

    observer.observe(host);
    return () => {
      observer.disconnect();
      cleanupLoadListener?.();
      if (idleHandle === undefined) return;
      if (usedIdleCallback) window.cancelIdleCallback?.(idleHandle);
      else window.clearTimeout(idleHandle);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative isolate h-full w-full",
        sculptureVariant === "dark" ? "text-purple-300" : "text-purple-500",
        className,
      )}
    >
      {mounted && webglAllowed ? (
        /*
          Fades the renderer in over the static ring it replaces, rather than
          cutting. Both occupy the same fixed-height box, so nothing moves —
          this is purely so the swap is not a visible pop. `animate-hero-fade-up`
          is not reused here: that one translates, and translating the sculpture
          on arrival would read as the object dropping into place.
        */
        <div className="h-full w-full animate-canvas-fade-in motion-reduce:animate-none">
          <ThreadScene
            variant={sculptureVariant}
            active={inView}
            // Gated on the fixed role, not the theme-flipped material — the
            // hero never drifts, regardless of which ground colour it is
            // currently rendering as.
            readProgress={variant === "dark" ? readProgress : undefined}
          />
        </div>
      ) : (
        /* The dashed inner ring turns only once the probe has actually
           resolved to a low-tier device — i.e. when this is the final
           rendering rather than the placeholder shown while deciding. It
           gives phones a living element in place of the sculpture without
           costing a WebGL context: one CSS rotation on one SVG circle. */
        <StaticThread animated={capabilityReady && !webglAllowed} />
      )}
    </div>
  );
}
