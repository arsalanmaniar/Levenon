import type { Product } from "@/lib/types";
import { availableSizes } from "@/lib/types";
import type { RatingSummary } from "@/lib/reviews/types";

/**
 * schema.org/Product as JSON-LD.
 *
 * JSON-LD rather than microdata: it keeps the markup clean and is what Google
 * documents as preferred. Rendered by the server as a plain <script> — no
 * client JS, no hydration cost.
 *
 * Prices are emitted in **major units** because that is what schema.org expects,
 * derived from the integer minor units we store. Availability comes from real
 * variant stock, never a hardcoded InStock.
 *
 * The rating aggregate arrives as a prop rather than being read here: the
 * review table is `server-only` and the page already holds it for the header
 * stars, so passing it down keeps one read per render and one source of truth
 * between what the page shows and what the crawler is told.
 */
export function ProductJsonLd({
  product,
  siteUrl,
  inStock,
  rating,
}: {
  product: Product;
  siteUrl: string;
  inStock: boolean;
  /** Omitted, or `count: 0`, means no `aggregateRating` is emitted. */
  rating?: RatingSummary;
}) {
  const url = `${siteUrl}/product/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.blurb || product.description[0] || undefined,
    sku: product.sku,
    url,
    category: product.category.name,
    brand: { "@type": "Brand", name: "Levenon" },
    // Only real images; a generated share card is not product photography and
    // should not be presented to a shopping crawler as such.
    ...(product.images.length > 0
      ? { image: product.images.map((image) => image.url) }
      : {}),
    ...(availableSizes(product).length > 0
      ? { size: availableSizes(product) }
      : {}),
    // Only when there is something to aggregate. An `aggregateRating` with a
    // `reviewCount` of zero is invalid structured data and is flagged as such,
    // so the absence of reviews must be an absent property, not a zero.
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      // schema.org wants a decimal string in major units.
      price: (product.priceMinor / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Server-rendered from our own typed data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
