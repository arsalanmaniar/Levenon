import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Hand-drawn, not `lucide-react` — the installed version (1.33) ships no
 * brand/social glyphs (most icon sets dropped them over trademark
 * licensing), which the brief's own wording anticipated ("lucide or simple
 * SVG"). Single-path, hairline stroke, matching every other icon's
 * `strokeWidth={1.5}` weight on this site.
 */
function InstagramGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <path d="M15.5 8.5h-2a1.5 1.5 0 0 0-1.5 1.5v2h3.3l-.4 3H12v7" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="3" y="3" width="18" height="18" rx="5" />
    </svg>
  );
}

/**
 * Footer, redesigned to the client brief (2026-08-26): four columns, dark
 * (`bg-ink`/`text-paper`) — a second, disclosed exception to SKILL.md §6's
 * "exactly one dark section per page" (the first being the atelier). That
 * rule is not silently re-written here; the footer simply now also inverts,
 * per this explicit later instruction, and SKILL.md §6 is updated to record
 * it as a second named exception rather than left contradicting the shipped
 * page.
 *
 * "About" and "Bank Transfer Details" are real pages (`/about`,
 * `/bank-transfer`), built for this pass — the brief names them as footer
 * links but neither existed; a previous pass's footer explicitly avoided
 * inventing an "About" link for exactly this reason (no route, no content),
 * so this gives it both rather than pointing at `#`. "Materials" points at
 * `/collections` — the fabric-browse page already built for the nav
 * redesign is what "materials" means on this site; a second page repeating
 * the same six fabrics would be the fabricated content this codebase's own
 * established practice avoids.
 *
 * Instagram/Facebook are placeholder `#` links, as the brief explicitly asks
 * for ("link to # for now") — the one deliberate exception to "every href
 * resolves to something real" elsewhere in this file, and disclosed as such
 * rather than silently matching the rest.
 */
const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Pieces" },
      { href: "/new-in", label: "New In" },
      { href: "/shop?category=lawn", label: "Lawn" },
      { href: "/shop?category=cotton", label: "Cotton" },
      { href: "/shop?category=chiffon", label: "Chiffon" },
      { href: "/shop?category=silk", label: "Silk" },
      { href: "/shop?category=organza", label: "Organza" },
      { href: "/shop?category=net", label: "Net" },
    ],
  },
  {
    title: "Info",
    links: [
      { href: "/about", label: "About" },
      { href: "/atelier", label: "Atelier" },
      { href: "/stockists", label: "Stockists" },
      { href: "/collections", label: "Materials" },
      { href: "/size-guide", label: "Size Guide" },
      { href: "/track", label: "Track Order" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns" },
      { href: "/contact", label: "Contact" },
      { href: "/bank-transfer", label: "Bank Transfer Details" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", Icon: InstagramGlyph },
  { label: "Facebook", Icon: FacebookGlyph },
];

/** One footer link — the underline draws in via `clip-path`, left to right, per the brief. */
function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[40px] items-center text-sm text-charcoal transition-colors duration-200 ease-state hover:text-paper"
    >
      <span className="relative">
        {label}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-full bg-purple-500 transition-[clip-path] duration-300 ease-enter [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0_0_0)]"
        />
      </span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer id="stockists-footer" className="scroll-mt-[var(--nav-h)] bg-ink text-paper">
      <div className="mx-auto max-w-shell px-6 py-20 md:px-12 md:py-24 lg:px-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Col 1 — brand statement + social. */}
          <div>
            <Wordmark className="text-[2.25rem]" />
            <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-paper/70">
              Unstitched. Yours to finish.
            </p>
            <ul className="mt-6 flex items-center gap-4">
              {SOCIALS.map(({ label, Icon }) => (
                <li key={label}>
                  <a
                    href="#"
                    aria-label={label}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-paper/70 transition-[color,transform] duration-200 ease-state hover:scale-[1.15] hover:text-purple-300"
                  >
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2–4 — link columns, equal width, tops aligned by the grid itself. */}
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="border-b border-paper/20 pb-4 font-mono text-xs uppercase tracking-[0.18em] text-paper/60">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-paper/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="label text-paper/60">© {new Date().getFullYear()} Levenon</p>
            <p className="label text-paper/60">Made in Pakistan</p>
          </div>
          {/* A second toggle, per the brief ("moved here from nav — keep one
              in nav too") — the nav's own icon-only instance is untouched. */}
          <ThemeToggle showLabel />
        </div>
      </div>
    </footer>
  );
}
