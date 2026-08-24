import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Crawl everything except the JSON API and any future admin surface.
 *
 * `/api/*` is disallowed because it serves the same catalogue the pages do —
 * indexing it would duplicate every product as a raw JSON result. Next's own
 * chunks are deliberately left crawlable: Google renders the page with them,
 * and blocking them makes the site look broken to the renderer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
