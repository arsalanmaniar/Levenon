/**
 * Canonical origin and shared site copy.
 *
 * Lives outside app/layout.tsx so sitemap.ts and robots.ts can read it without
 * importing the whole root layout (and its provider tree) into a metadata route.
 * Set NEXT_PUBLIC_SITE_URL for the real domain; the fallback keeps builds
 * deterministic and stops relative OG image URLs — which no crawler resolves —
 * from shipping.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://levenon.pk";

export const siteName = "Levenon";

export const siteDescription =
  "Unstitched three-piece suits — lawn, cotton, chiffon, silk, organza and net. Embroidered by hand, cut by your own tailor.";
