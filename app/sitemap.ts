import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/server/products";
import { siteUrl } from "@/lib/site";

/**
 * Sitemap, generated from whichever catalogue source is active.
 *
 * It reads the same `listProducts` seam as the pages do, so when the database
 * credentials land the sitemap starts listing real rows with no change here.
 * Product URLs use the canonical slug form — the numeric-id route resolves too,
 * but only one of the pair belongs in a sitemap.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /*
   * The small content routes. Indexable and genuinely useful to a searcher
   * ("levenon shipping", "unstitched size guide"), unlike `/track` and
   * `/wishlist`, which hold personal state and set `robots: noindex`
   * themselves — those are correctly absent here.
   */
  const contentEntries: MetadataRoute.Sitemap = [
    "/size-guide",
    "/shipping",
    "/returns",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...productEntries,
    ...contentEntries,
  ];
}
