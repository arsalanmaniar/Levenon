import { FacebookIcon, InstagramIcon, SocialLink, TikTokIcon } from "./social-icons";

/**
 * Fixed social sidebar (client brief, 2026-08-27) — left edge, vertical
 * stack, `lg`+ only. `top-1/2 -translate-y-1/2` is "halfway down the page"
 * read as halfway down the *viewport* rather than the full document —
 * "halfway down the page" for a `position: fixed` element can only mean the
 * viewport, since a fixed element has no scroll position of its own to be
 * halfway *down* in the document sense.
 *
 * `TikTokIcon` here gets `text-ink`, the footer's own instance gets
 * `text-paper` — this sidebar sits over the page's ordinary `--paper`
 * background for almost its entire scroll range, unlike the footer, which
 * is always `bg-ink`. See that icon's own doc comment.
 */
export function SocialSidebar() {
  return (
    <div className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
      <SocialLink href="#" label="Instagram" brand="instagram">
        <InstagramIcon className="h-7 w-7" />
      </SocialLink>
      <SocialLink href="#" label="Facebook" brand="facebook">
        <FacebookIcon className="h-7 w-7" />
      </SocialLink>
      <SocialLink href="#" label="TikTok" brand="tiktok">
        <TikTokIcon className="h-7 w-7 text-ink" />
      </SocialLink>
    </div>
  );
}
