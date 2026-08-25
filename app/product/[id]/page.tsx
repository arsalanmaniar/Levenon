import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { PdpGallery } from "@/components/products/pdp-gallery";
import { PdpAccordion } from "@/components/products/pdp-accordion";
import { ProductVisual } from "@/components/products/product-visual";
import { ProductCard } from "@/components/products/product-card";
import { SpotlightSurface } from "@/components/ui/spotlight-surface";
import { Reveal } from "@/components/ui/reveal";
import { StitchDivider } from "@/components/ui/stitch-divider";
import { AddToCart } from "@/components/cart/add-to-cart";
import { MobileAddBar } from "@/components/cart/mobile-add-bar";
import { SizeGuide } from "@/components/products/size-guide";
import { RecentlyViewedStrip } from "@/components/recently-viewed/recently-viewed-strip";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import { ShareButton } from "@/components/products/share-button";
import { StarRating } from "@/components/reviews/stars";
import { REVIEW_ROW, ReviewItem } from "@/components/reviews/review-item";
import { ReviewList } from "@/components/reviews/review-list";
import {
  LiveRating,
  ReviewSessionProvider,
} from "@/components/reviews/review-session";
import { getAverageRating, getReviews } from "@/lib/reviews/reviews-data";
import type { Review } from "@/lib/reviews/types";
import { getProduct, listProducts } from "@/lib/server/products";
import { formatPrice, isInStock } from "@/lib/types";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import { ProductJsonLd } from "@/components/products/product-json-ld";

type Params = { params: { id: string } };

/**
 * Rendering strategy.
 *
 * `dynamicParams = false` — the param set is closed, so an unknown slug is a
 * true framework 404. This is measured, not assumed: with `dynamicParams = true`
 * an unknown slug renders the 404 page but answers **HTTP 200**, a soft 404 that
 * tells crawlers and uptime checks the page exists.
 *
 * `export const dynamic` cannot help here. Next reads it as a literal at compile
 * time, so `activeSource() === "database" ? "force-dynamic" : "auto"` is silently
 * ignored — verified: the route stayed SSG and the soft 404 came back. Making it
 * a literal `"force-dynamic"` would fix 404s but give up static rendering for
 * every product page on both sources.
 *
 * Closing the param set works for the database source because the storefront
 * publishes a **curated subset**, not the full 3,662-row table — prebuilding all
 * of it at build time is cheap. The trade-off: a product added to the ERP after
 * a deploy 404s until the next build. When that becomes a problem, the fix is an
 * on-demand revalidation webhook from the ERP, not opening the param set.
 */
export const dynamicParams = false;

/** ISR: existing pages pick up price and stock changes without a deploy. */
export const revalidate = 300;

export async function generateStaticParams() {
  // Bounded: the subset is curated, but never trust a filter to stay small.
  const products = await listProducts({ limit: 500 });
  return products.flatMap((product) => [
    { id: product.slug },
    { id: product.id },
  ]);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "Piece not found" };

  const canonical = `/product/${product.slug}`;
  const description = product.blurb || product.description[0] || siteDescription;

  // Real photography when it exists; otherwise fall through to the route-level
  // generated share card rather than emitting a broken image URL.
  const first = product.images[0];
  const images = first
    ? [{ url: first.url, width: first.width, height: first.height, alt: first.alt }]
    : // Declaring an openGraph block replaces the parent's wholesale, so the
      // site share card must be named again rather than inherited.
      [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${siteName} — Unstitched. Yours to finish.`,
        },
      ];

  return {
    // Root layout supplies the "— Levenon" suffix via the title template.
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName,
      locale: "en_PK",
      url: canonical,
      title: product.name,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const product = await getProduct(params.id);

  // A missing or archived piece renders the not-found segment, which keeps the
  // nav and footer — a dead end with no way back is a worse failure than a 404.
  if (!product) notFound();

  // Read once on the server and shared three ways: the header stars, the
  // aggregate in the structured data, and the list itself. The review module is
  // `server-only`, so this is the only side of the wire it is ever read from.
  const reviews = getReviews(product.slug);
  const rating = getAverageRating(product.slug);

  // "You might also like" (client brief, 2026-08-26): same fabric category,
  // sorted by total stock on hand descending, max 4 — a proxy for "what's
  // actually moving" in the absence of real sales data, same reasoning
  // `TopSelling` uses on the home page.
  const related = (await listProducts({ category: product.category.slug }))
    .filter((candidate) => candidate.id !== product.id)
    .sort(
      (a, b) =>
        b.variants.reduce((sum, variant) => sum + variant.stockOnHand, 0) -
        a.variants.reduce((sum, variant) => sum + variant.stockOnHand, 0),
    )
    .slice(0, 4);

  return (
    <>
      <ProductJsonLd
        product={product}
        siteUrl={siteUrl}
        inStock={isInStock(product)}
        rating={rating}
      />
      <SiteNav />
      {/*
        The provider spans the summary and the reviews section so both read one
        array. Server-rendered children pass through unchanged — this does not
        turn the article into a client component.
      */}
      <ReviewSessionProvider reviews={reviews}>
      <main id="main">
        {/* Bottom padding matches the mobile bar's own height, so it never
            overlaps the related-products strip or the footer beneath it. */}
        <article className="mx-auto max-w-shell px-6 py-12 pb-24 md:px-12 lg:px-20 md:py-16 lg:pb-16">
          <nav aria-label="Breadcrumb" className="label text-charcoal">
            <Link href="/#collection" className="hover:text-purple-500">
              Collection
            </Link>
            <span aria-hidden="true" className="px-2 text-hairline">
              /
            </span>
            <span>{product.category.name}</span>
          </nav>

          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/*
              ~58%/42% via the locked 12-column grid (SKILL.md §4) rather than
              literal 55%/45% widths — close enough to the brief's ratio that
              switching off the grid system for three percentage points
              wasn't worth it. Sticky on `lg`: the gallery stays in view
              while the (usually taller, once the accordion below opens)
              right column scrolls past it.
            */}
            <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:col-span-7 lg:self-start">
              <PdpGallery
                images={product.images}
                productName={product.name}
                sku={product.sku}
                fallback={<ProductVisual variant={product.visual} />}
              />
            </div>

            <div className="lg:col-span-5">
              <Reveal>
                <p className="label text-charcoal">{product.category.name}</p>
                {/*
                  32px Manrope 700 — a deliberate, disclosed step off
                  SKILL.md §3's locked Page H1 tier (clamp 2rem–3.25rem,
                  weight 800), for this element specifically, per an
                  explicit later brief. Everything else that tier governs
                  (/track, /wishlist) is untouched.
                */}
                <h1 className="mt-5 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.02em]">
                  {product.name}
                </h1>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <p className="font-mono text-2xl font-medium text-purple-500">
                      {formatPrice(product)}
                    </p>
                    {/* Nothing at all when there are none. "0 reviews" beside
                        a price reads as a verdict on the piece rather than as
                        an absence of evidence about it. */}
                    <LiveRating variant="header" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ShareButton />
                    <WishlistHeart product={product} variant="inline" />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <div id="add-to-cart" className="mt-8 scroll-mt-[calc(var(--nav-h)+1rem)]">
                  <AddToCart product={product} />
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <SizeGuide />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-12">
                  <PdpAccordion
                    sections={[
                      {
                        title: "The cloth",
                        content: (
                          <div className="space-y-4">
                            {product.description.map((paragraph) => (
                              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                            ))}
                          </div>
                        ),
                      },
                      {
                        title: "Construction",
                        content: (
                          <dl className="space-y-4">
                            {product.specs.map((spec) => (
                              <div
                                key={spec.label}
                                className="flex justify-between gap-6 border-b border-hairline pb-4 last:border-b-0 last:pb-0"
                              >
                                <dt className="label text-charcoal">{spec.label}</dt>
                                <dd className="text-sm text-ink">{spec.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ),
                      },
                      {
                        title: "Sizing & care",
                        content: (
                          <div className="space-y-4">
                            <p>
                              Every piece here is unstitched cloth, so there is no
                              finished garment size — cut to the measurements on
                              the size guide, not to a label.
                            </p>
                            <p>
                              {product.specs.find((spec) => spec.label === "Care")
                                ?.value ?? "Hand wash only."}{" "}
                              Keep it out of direct sun while it dries, and iron on
                              the reverse where there is embroidery.
                            </p>
                          </div>
                        ),
                      },
                      {
                        title: "Delivery",
                        content: (
                          <div className="space-y-4">
                            <p>
                              Every order gets a confirmation page and a status
                              you can check any time — dispatch time and
                              courier charges for your city are confirmed
                              there, since they vary across Pakistan and this
                              is a small-run shop, not a courier network with
                              a fixed table.
                            </p>
                            <p>
                              Full detail on{" "}
                              <Link href="/shipping" className="text-ink underline decoration-hairline underline-offset-4 hover:text-purple-500 hover:decoration-purple-500">
                                shipping
                              </Link>{" "}
                              and{" "}
                              <Link href="/returns" className="text-ink underline decoration-hairline underline-offset-4 hover:text-purple-500 hover:decoration-purple-500">
                                returns
                              </Link>
                              , and you can track a placed order any time from{" "}
                              <Link href="/track" className="text-ink underline decoration-hairline underline-offset-4 hover:text-purple-500 hover:decoration-purple-500">
                                Track order
                              </Link>
                              .
                            </p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </article>

        <section
          id="reviews"
          aria-labelledby="reviews-heading"
          className="mx-auto max-w-shell scroll-mt-24 px-6 pb-24 md:px-12 lg:px-20 md:pb-32"
        >
          <StitchDivider className="mb-16" />

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-hairline pb-6">
            <h2
              id="reviews-heading"
              className="font-display text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]"
            >
              Reviews
            </h2>
            <LiveRating variant="section" />
          </div>

          {/* The list reads its sort order from `useSearchParams`, which opts
              its subtree out of the prerender — hence the boundary. The
              fallback is the same list, statically rendered in the default
              order, so the reviews are in the HTML for a crawler and for a
              reader whose JavaScript never arrives. */}
          <Suspense fallback={<StaticReviews reviews={reviews} />}>
            <ReviewList reviews={reviews} productSlug={product.slug} />
          </Suspense>
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-shell px-6 pb-24 md:px-12 lg:px-20 md:pb-32">
            <h2 className="border-b border-hairline pb-6 font-display text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              More from this fabric
            </h2>
            <SpotlightSurface>
              <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((candidate, index) => (
                <Reveal as="li" key={candidate.id} delay={index * 0.07}>
                  <ProductCard product={candidate} />
                </Reveal>
                ))}
              </ul>
            </SpotlightSurface>
          </section>
        )}
        <RecentlyViewedStrip product={product} />
      </main>
      </ReviewSessionProvider>
      <SiteFooter />
      <MobileAddBar product={product} />
    </>
  );
}

/**
 * The prerendered half of the reviews section: every review in the default
 * order, no sort control, no form. Shares `ReviewItem` and `REVIEW_ROW` with
 * the interactive list, so the two cannot drift apart visually.
 */
function StaticReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="mt-12">
      <p className="label text-charcoal">
        {reviews.length} {reviews.length === 1 ? "review" : "reviews"} — most
        recent first
      </p>
      <ol className="mt-12">
        {reviews.map((review) => (
          <li key={review.id} className={REVIEW_ROW}>
            <ReviewItem review={review} />
          </li>
        ))}
      </ol>
    </div>
  );
}
