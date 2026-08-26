import Image from "next/image";
import { ThreadButton } from "@/components/ui/thread-button";
import { listProducts } from "@/lib/server/products";

/**
 * Full-bleed editorial banner (client brief, 2026-08-29, Item 4) — the
 * campaign-banner convention Sapphire and Maria B both open a season with.
 * Sits directly under the hero and above New Arrivals (Item 5's rhythm),
 * so this is a server component like every other section on the page: the
 * Ken Burns drift and the text stagger are both plain CSS, no client JS.
 *
 * No `max-w-shell`/`px-*` wrapper on the section itself — every other
 * section on this page opts into the shared gutter deliberately; this one
 * is full-bleed by the same deliberateness, in the other direction. The
 * text column gets its own `px-6 md:px-12 lg:px-20` so its *content* still
 * lines up with the rest of the page's left edge even though the image
 * behind it runs to the viewport edge.
 */
export async function CollectionBanner() {
  const catalogue = await listProducts();
  const withPhotos = catalogue.filter((product) => product.images[0]);

  // The catalogue is near-universally portrait/square photography (see
  // catalogue-data.ts's own provenance note) — this is the one genuinely
  // landscape frame in it, hand-picked rather than computed, since a
  // computed "highest width/height ratio" pick would silently break the
  // moment the database source goes live with its placeholder 1000×1250
  // dimensions on every image (lib/server/db/mapping.ts). Falls back to
  // any photographed product's first frame — cropped by `object-cover`
  // regardless of its native aspect — if the named piece is ever retired.
  const scifflie = withPhotos.find((product) => product.slug === "scifflie-lawn-suit");
  const image = scifflie?.images[1] ?? scifflie?.images[0] ?? withPhotos[0]?.images[0] ?? null;

  if (!image) return null;

  return (
    <section className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
      <div className="absolute inset-0 animate-banner-ken-burns motion-reduce:animate-none">
        <Image
          src={image.url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* ink/60% on the left, fading to transparent on the right — the
          text sits over the dense side, the piece itself stays visible on
          the other. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/30 to-transparent"
      />

      <div className="relative flex h-full items-center px-6 md:px-12 lg:px-20">
        <div className="max-w-[36ch]">
          <p
            style={{ animationDelay: "300ms" }}
            className="animate-slide-in-left font-mono text-xs uppercase tracking-[0.3em] text-purple-300 motion-reduce:animate-none"
          >
            New Collection
          </p>

          <h2
            style={{ animationDelay: "420ms" }}
            className="animate-slide-in-left mt-4 font-display text-balance text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-paper motion-reduce:animate-none"
          >
            Edit 01 — Unstitched Pakistan
          </h2>

          <p
            style={{ animationDelay: "540ms" }}
            className="animate-slide-in-left mt-4 text-body text-paper/70 motion-reduce:animate-none"
          >
            48 pieces. 6 fabrics.
          </p>

          <div
            style={{ animationDelay: "660ms" }}
            className="animate-slide-in-left mt-8 motion-reduce:animate-none"
          >
            <ThreadButton href="#collection" tone="outline-invert" icon>
              Explore the Edit
            </ThreadButton>
          </div>
        </div>
      </div>
    </section>
  );
}
