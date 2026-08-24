import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import {
  shopWhatsAppUrl,
  SUPPORT_MESSAGE,
  WHATSAPP_ARIA_LABEL,
} from "@/lib/whatsapp";

/**
 * Footer columns.
 *
 * Restructured to the Phase 7 brief (Shop / Help / Company).
 *
 * Help now points at real routes — `/shipping`, `/returns`, `/size-guide` and
 * `/contact` were built for exactly this, replacing the `/#atelier` anchors
 * that previously stood in for them. Those pages deliberately state only what
 * this shop can actually honour (no invented delivery windows, returns
 * periods, addresses or phone numbers); see each page's own note.
 *
 * Two deliberate omissions remain, both because the alternative is a link that
 * lies about what exists:
 *
 *   - "Best Sellers", "Journal" and "About" have no route and no data behind
 *     them. Shop carries the real fabric filters (which resolve to genuine
 *     filtered grids) and Company carries only what exists.
 *   - "Instagram" is omitted rather than linked to a guessed handle. Inventing
 *     a social URL for a real brand is the kind of plausible-looking detail
 *     that survives into production and embarrasses someone; the owner can add
 *     the real one in a line.
 *
 * Every href below resolves to something real — verified against the app
 * router and `lib/server/catalogue-data.ts`.
 */
const columns = [
  {
    title: "Shop",
    links: [
      { href: "/#new-in", label: "New In" },
      { href: "/#collection", label: "All pieces" },
      { href: "/?category=lawn#collection", label: "Lawn" },
      { href: "/?category=cotton#collection", label: "Cotton" },
      { href: "/?category=chiffon#collection", label: "Chiffon" },
      { href: "/?category=silk#collection", label: "Silk" },
      { href: "/?category=organza#collection", label: "Organza" },
      { href: "/?category=net#collection", label: "Net" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track order" },
      { href: "/size-guide", label: "Size guide" },
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns" },
      { href: "/contact", label: "Contact" },
      // Resolved at render (see `whatsAppHref` below) rather than stored here,
      // because it is an external link with a pre-filled message and must
      // disappear entirely if no number is configured.
      { href: null, label: "WhatsApp" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#atelier", label: "The atelier" },
      { href: "/#new-in", label: "This season" },
      { href: "/wishlist", label: "Your wishlist" },
    ],
  },
];

export function SiteFooter() {
  const whatsAppHref = shopWhatsAppUrl(SUPPORT_MESSAGE);

  return (
    <footer
      id="stockists"
      className="scroll-mt-[var(--nav-h)] border-t border-hairline"
    >
      <div className="mx-auto max-w-shell px-6 py-20 md:px-10 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand statement — the wordmark at display scale, carrying the
              real ring and dashed thread from the shared component. */}
          <div className="lg:col-span-4">
            <Wordmark className="text-[2rem]" />
            <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-charcoal">
              Unstitched three-piece suits, cut in small runs. We set the cloth
              and the embroidery; your tailor sets the fit.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8"
          >
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="label text-charcoal">{column.title}</h2>
                <ul className="mt-5 space-y-0.5">
                  {column.links.map((link) => {
                    /*
                       A null `href` marks the WhatsApp row, which is external,
                       carries a pre-filled message, and is dropped entirely
                       when no number is configured — the same rule every other
                       WhatsApp entry point follows.
                    */
                    const isWhatsApp = link.href === null;
                    if (isWhatsApp && !whatsAppHref) return null;
                    const Tag = isWhatsApp ? "a" : Link;
                    const linkProps = isWhatsApp
                      ? {
                          href: whatsAppHref as string,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          "aria-label": `${WHATSAPP_ARIA_LABEL} — opens in a new tab`,
                        }
                      : { href: link.href as string };

                    return (
                    <li key={link.label}>
                      <Tag
                        {...linkProps}
                        className="group inline-flex min-h-[40px] items-center text-sm text-ink transition-colors duration-200 ease-state hover:text-purple-500"
                      >
                        <span className="relative">
                          {link.label}
                          {/* The thread, drawn under the label on hover —
                              the same motif the primary nav uses, so the
                              footer reads as the same site rather than a
                              plain link list. */}
                          <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100" />
                        </span>
                      </Tag>
                    </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-charcoal">
            © {new Date().getFullYear()} Levenon
          </p>
          <p className="label text-charcoal">Unstitched. Yours to finish.</p>
        </div>
      </div>
    </footer>
  );
}
