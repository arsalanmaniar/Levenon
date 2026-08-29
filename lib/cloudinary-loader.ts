/**
 * next/image loader that delegates resizing to Cloudinary's own CDN.
 *
 * WHY THIS EXISTS — measured, not theoretical.
 *
 * With Next's built-in optimizer, a full homepage load asks `/_next/image` to
 * fetch and re-encode every product frame on demand. Measured on this machine
 * against a production `next start`: of 32 images on `/`, **14 never finished
 * loading** — `naturalWidth === 0` after an 18-second settle, with **zero**
 * 4xx/5xx responses, i.e. the requests were still queued, not failing. That is
 * the "blank product tiles" symptom reported against this site: the tiles were
 * never broken, the optimizer was simply saturated. Each source frame is an
 * 80–500 kB Cloudinary original and sharp re-encodes them a few at a time in
 * one Node process.
 *
 * Cloudinary is already an image CDN with transformation built into the URL
 * path, so re-encoding its output through a second optimizer is duplicated
 * work on the critical path. Injecting `f_auto,q_auto,w_<width>` after
 * `/upload/` makes Cloudinary serve an appropriately sized AVIF/WebP directly,
 * globally cached, with no Node involvement at all.
 *
 * `f_auto` negotiates the format from the browser's Accept header, which is
 * what `images.formats: ["image/avif", "image/webp"]` was doing before — that
 * setting only applies to the built-in optimizer and no longer has any effect
 * once a custom loader is in use, so the capability moves here rather than
 * being lost.
 *
 * Non-Cloudinary hosts (the Daraz/slatic/S3 fallbacks declared in
 * `next.config.mjs`, which no current catalogue row actually uses) are passed
 * through untouched. They render correctly, just without transformation —
 * the right failure mode, since a wrong guess at another CDN's URL grammar
 * would break the image outright.
 *
 * **Local `/public` assets go through this same untouched pass-through**
 * (added 2026-09-02, for the hero's campaign-asset slot — see
 * `lib/server/hero-assets.ts`) — deliberately, not an oversight. The
 * obvious fix, routing them through Next's own built-in `/_next/image`
 * optimizer, was tried and reverted: `images.loader: "custom"` disables
 * that endpoint entirely (it 404s), which is documented Next.js behaviour,
 * not a bug here. Local hero campaign photography therefore ships as the
 * exact bytes supplied, with no server-side resizing or re-encoding at
 * any width — see `public/images/hero/README.md`'s "Delivery" section for
 * the pre-optimisation this puts on whoever supplies the files.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const marker = "/image/upload/";
  const at = src.indexOf(marker);

  // Not a Cloudinary delivery URL — hand it back unchanged.
  if (!src.includes("res.cloudinary.com") || at === -1) return src;

  const head = src.slice(0, at + marker.length);
  const tail = src.slice(at + marker.length);

  // `q_auto` lets Cloudinary pick per-image; an explicit `quality` prop wins.
  const transforms = [
    "f_auto",
    quality ? `q_${quality}` : "q_auto",
    `w_${width}`,
    // Never upscale past the source: cheaper, and avoids soft-looking tiles.
    "c_limit",
  ].join(",");

  return `${head}${transforms}/${tail}`;
}
