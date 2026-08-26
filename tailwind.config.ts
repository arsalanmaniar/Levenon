import type { Config } from "tailwindcss";

/**
 * Levenon design tokens.
 * Values live as CSS custom properties in app/globals.css; this file only maps
 * them into Tailwind's theme so components never touch raw hex.
 * See .claude/skills/levenon-brand-style/SKILL.md
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // rgb(... / <alpha-value>) rather than var(--ink) directly: the latter
        // silently drops every /opacity modifier. See the note in globals.css.
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        charcoal: "rgb(var(--charcoal-rgb) / <alpha-value>)",
        hairline: "rgb(var(--hairline-rgb) / <alpha-value>)",
        // Channels, not the raw hex the brief specified. A bare `#2D7A4F`
        // silently drops every /opacity modifier — the systemic bug found and
        // fixed in the SEO pass. Same colour, same `text-success` class name.
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        // Urgency accent (client brief, 2026-08-27) — low-stock badges/text.
        amber: "rgb(var(--amber-rgb) / <alpha-value>)",
        // Form validation (client brief, 2026-08-28) — invalid-field borders
        // and inline error text. Same channel-token reasoning as success/amber.
        error: "rgb(var(--error-rgb) / <alpha-value>)",
        purple: {
          300: "rgb(var(--purple-300-rgb) / <alpha-value>)",
          500: "rgb(var(--purple-500-rgb) / <alpha-value>)",
          700: "rgb(var(--purple-700-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      /*
       * Fluid type tiers (client brief, 2026-08-27: "replace all fixed font
       * sizes with clamp() values" — named tiers, one utility per tier).
       * `.label` in globals.css already covers "Small/labels" (and, by
       * construction, most button/nav/footer text built on it); these are
       * the tiers that had no single shared rule to fix in one place.
       * Section H3 has no existing call site on the site yet — added so one
       * exists the moment a component needs it, per the brief's own naming.
       */
      /*
       * Corrected, smaller clamp values (client brief, 2026-08-28 — "Previous
       * clamp() values were too large"). `nav`/`footer-heading`/`footer-link`/
       * `btn` are gone: the brief now wants those four fixed, not fluid
       * ("Nav links: 12px fixed (not clamp — nav is fixed height)" and
       * three more like it), so they're literal `text-[Npx]` at their call
       * sites instead of a shared clamp token — see nav-links.tsx,
       * site-footer.tsx, and the shared button base classes.
       */
      fontSize: {
        hero: "clamp(2.25rem, 5vw, 4.5rem)", // 36px – 72px
        h2: "clamp(1.5rem, 3vw, 2.625rem)", // 24px – 42px
        h3: "clamp(1.125rem, 2vw, 1.75rem)", // 18px – 28px
        body: "clamp(0.8125rem, 1vw, 0.9375rem)", // 13px – 15px
        "card-name": "clamp(0.8125rem, 1vw, 0.9375rem)", // 13px – 15px
        "card-price": "clamp(0.75rem, 0.9vw, 0.875rem)", // 12px – 14px
      },
      letterSpacing: {
        label: "0.18em",
      },
      maxWidth: {
        shell: "1400px",
        measure: "65ch",
      },
      transitionTimingFunction: {
        // Brand easing — entrances vs. state changes. No bounce, no elastic.
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        state: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      boxShadow: {
        // Purple-tinted lift only. Never gray-black.
        thread: "0 24px 60px -32px rgba(124, 42, 232, 0.35)",
      },
      keyframes: {
        "thread-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        // Used by the newsletter success panel. (An earlier audit called this
        // dead; it was written before that panel existed — verify before you
        // delete it again.)
        "rise-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Background beams: a slow vertical drift, compositor-only.
        "beam-drift": {
          "0%, 100%": { transform: "translateY(-6%) scaleY(1)", opacity: "0.7" },
          "50%": { transform: "translateY(6%) scaleY(1.08)", opacity: "1" },
        },
        // WhatsApp float's pulse — the ring motif expanding from the button
        // edge and fading, compositor-only (transform + opacity).
        "whatsapp-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        // Hero aurora: the radial glow's own position drifts, not its opacity
        // or size — background-position is compositor-cheap where animating a
        // gradient's stops directly is not.
        "aurora-drift": {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "18% 12%" },
        },
        // The hero headline's load-in. A plain CSS keyframe, not Framer
        // Motion: it's present in the server HTML from first paint, so the
        // browser can start it before hydration ever runs — no flash of the
        // already-rendered heading being hidden and refaded once JS takes
        // over, which is exactly what `Reveal`'s "plain" mode (see
        // reveal.tsx) exists to avoid for above-the-fold content.
        "hero-fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // The 3D canvas arriving in place of the static ring. Opacity only —
        // both states occupy the same reserved box, so there is nothing to
        // move and a translate here would read as the object dropping in.
        "canvas-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // The scroll indicator's thread paying out downward, then fading
        // before it resets — a draw, not a bounce, so it never reads as a
        // loading spinner.
        "scroll-draw": {
          "0%": { transform: "scaleY(0)", opacity: "1" },
          "60%": { transform: "scaleY(1)", opacity: "1" },
          "100%": { transform: "scaleY(1)", opacity: "0" },
        },
        // Slow ambient zoom on the hero collage and atelier photo (client
        // brief, 2026-08-25) — "reveals more of the fabric" over time even
        // with no pointer on the tile. Kept to `scale`, compositor-only.
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.06)" },
        },
        // Theme toggle's press ripple (client brief, 2026-08-26) — a radial
        // flash expanding from the toggle to nothing. `pointer-events-none`
        // on the element itself (not this keyframe) is what keeps it from
        // blocking interaction.
        "theme-ripple": {
          "0%": { transform: "scale(0.3)", opacity: "0.5" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        // Low-stock badge pulse (client brief, 2026-08-27) — `motion-reduce`
        // usage at every call site turns this off entirely rather than
        // slowing it, per SKILL.md §7.
        "low-stock-pulse": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        // Collection banner (client brief, 2026-08-29, Item 4) — a single
        // pass, not the ambient infinite `ken-burns` loop above: "animation
        // on page load", not a continuous background drift.
        "banner-ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.04)" },
        },
        // Collection banner's text column: "slides in from the left" on
        // load, staggered per element via inline `animationDelay` — the
        // same idiom the hero's own `hero-fade-up` already uses, so this
        // stays a plain CSS keyframe rather than a second client component
        // built just to run a Framer `initial`/`animate` once.
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "thread-spin": "thread-spin 2.4s linear infinite",
        "rise-in": "rise-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "beam-drift": "beam-drift 30s ease-in-out infinite",
        "whatsapp-pulse": "whatsapp-pulse 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "aurora-drift": "aurora-drift 8s ease-in-out infinite",
        "hero-fade-up": "hero-fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "canvas-fade-in": "canvas-fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scroll-draw": "scroll-draw 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "ken-burns": "ken-burns 8s ease-in-out infinite alternate",
        "ken-burns-reverse": "ken-burns 8s ease-in-out infinite alternate-reverse",
        "theme-ripple": "theme-ripple 500ms ease-out",
        "low-stock-pulse": "low-stock-pulse 2s ease-in-out infinite",
        "banner-ken-burns": "banner-ken-burns 10s ease-out both",
        "slide-in-left": "slide-in-left 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
