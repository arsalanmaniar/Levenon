/**
 * Editorial CSS/SVG hero backgrounds (client brief, 2026-08-31) — replacing
 * product photography behind the hero entirely. The catalogue's photography
 * is portrait/square (garment shots), the wrong aspect for a landscape hero
 * band, and stretching or cropping it there has read wrong since the slider
 * shipped. This is the art-directed-campaign-slide idiom high-fashion sites
 * (Zara, COS) use for a hero moment that isn't a photograph — three flat
 * compositions built from the brand's own tokens and its own thread/ring/
 * stitch vocabulary (SKILL.md §5), not stock art.
 *
 * All three are presentational only — no hooks, no state. The rotation
 * keyframes they reference (`hero-ring-*`) live in globals.css, scoped
 * inside `@media (prefers-reduced-motion: no-preference)`, so a
 * reduced-motion reader simply never receives the animation rule; there is
 * nothing to branch on here.
 */

const WEAVE_LINES = [8, 24, 40, 56, 72, 88];

/** Slide 1 — "The Thread": ink ground, three concentric dashed rings turning at three different speeds, a faint diagonal weave behind them. */
export function ThreadArt() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0">
        {WEAVE_LINES.map((top) => (
          <span
            key={top}
            className="absolute left-[-20%] h-px w-[140%] bg-paper/5"
            style={{ top: `${top}%`, transform: "rotate(-18deg)" }}
          />
        ))}
      </div>

      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] sm:-right-20 sm:-top-20">
        <svg viewBox="0 0 600 600" fill="none" className="hero-ring-60s absolute inset-0 h-[600px] w-[600px]">
          <circle cx="300" cy="300" r="298" stroke="#7C2AE8" strokeWidth="1" strokeDasharray="2 12" />
        </svg>
        <svg
          viewBox="0 0 400 400"
          fill="none"
          className="hero-ring-80s absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2"
        >
          <circle cx="200" cy="200" r="198" stroke="#B98CF2" strokeWidth="2" strokeDasharray="1 9" />
        </svg>
        <svg
          viewBox="0 0 280 280"
          fill="none"
          className="hero-ring-40s absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2"
        >
          <circle cx="140" cy="140" r="139" stroke="#5B1A9E" strokeWidth="0.5" strokeDasharray="3 7" />
        </svg>
      </div>
    </div>
  );
}

/** Slide 2 — "The Fabric": a purple-to-ink diagonal gradient, nested diamonds right of centre, a fine dot grid, and two L-shaped corner marks. */
export function FabricArt() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #5B1A9E 0%, #0B0B0D 60%, #1A0A2E 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(251,250,248,0.4) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="absolute right-[6%] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rotate-45 bg-purple-500/20 sm:right-[10%] sm:h-[420px] sm:w-[420px]" />
      <div className="absolute right-[6%] top-1/2 h-[170px] w-[170px] -translate-y-1/2 rotate-[60deg] bg-purple-300/30 sm:right-[10%] sm:h-[240px] sm:w-[240px]" />

      <div className="absolute right-8 top-8 h-[60px] w-[60px] border-r border-t border-purple-300 sm:right-12 sm:top-12" />
      <div className="absolute bottom-8 left-8 h-[60px] w-[60px] border-b border-l border-purple-300 sm:bottom-12 sm:left-12" />
    </div>
  );
}

const ASTERISKS = [
  { top: "14%", left: "62%" },
  { top: "24%", left: "84%" },
  { top: "68%", left: "16%" },
  { top: "82%", left: "58%" },
];

/** Slide 3 — "The Edit": the one light slide. A giant near-invisible wordmark behind two hairline rules, a vertical rule right of centre, and four asterisk marks. */
export function EditArt() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-paper">
      <p
        className="absolute inset-0 flex select-none items-center justify-center whitespace-nowrap text-center font-display font-extrabold leading-none text-ink/[0.04]"
        style={{ fontSize: "200px", letterSpacing: "-8px" }}
      >
        LEVENON
      </p>

      <span className="absolute inset-x-0 top-[30%] h-px bg-purple-500" />
      <span className="absolute inset-x-0 top-[70%] h-px bg-purple-500" />
      <span className="absolute bottom-0 left-1/2 top-0 w-px bg-purple-300/40" />

      {ASTERISKS.map((pos, index) => (
        <span
          key={index}
          className="absolute font-display text-[12px] text-purple-500"
          style={{ top: pos.top, left: pos.left }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export function HeroSlideArt({ variant }: { variant: "thread" | "fabric" | "edit" }) {
  if (variant === "thread") return <ThreadArt />;
  if (variant === "fabric") return <FabricArt />;
  return <EditArt />;
}
