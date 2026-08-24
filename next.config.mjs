/**
 * Host of LEVENON_MEDIA_BASE_URL, if configured — declared so next/image will
 * serve product photography from it once the catalogue database is wired.
 */
const mediaHost = (() => {
  try {
    return process.env.LEVENON_MEDIA_BASE_URL
      ? new URL(process.env.LEVENON_MEDIA_BASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three ships untranspiled ESM examples that some toolchains choke on.
  // (Keeping three out of the initial bundle is the dynamic import's job,
  // not this setting's — see components/3d/thread-canvas.tsx.)
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "framer-motion"],
  },
  images: {
    /*
     * Product media hosts, enumerated — never a wildcard. next/image refuses
     * an undeclared remote host, so a missing entry is a 500 rather than a
     * merely wrong-looking image.
     *
     * Every hostname below was counted in `LevenonIdraak.sql` and sampled with
     * live HTTP HEAD requests (all 200, image/jpeg):
     *
     *   res.cloudinary.com      6,308 refs — the client's OWN account
     *                           (cloud `dhyz3jzmy`). 5,307 `media` rows on the
     *                           `cloudinary` disk, covering 1,064 active
     *                           products. This is the preferred source: the
     *                           client controls it, so it cannot be revoked or
     *                           hotlink-blocked from under us.
     *   static-01.daraz.pk     16,263 refs — marketplace CDN, the *originals*
     *   sg-test-11.slatic.net   9,045 refs   the client re-uploaded to
     *   pk-live-21.slatic.net     178 refs   Cloudinary. Declared as a
     *                                        fallback for rows with no
     *                                        Cloudinary media, but hotlinking
     *                                        a marketplace CDN is their call
     *                                        to make, not ours.
     *
     * Deliberately NOT declared: `www.daraz.pk` (7,426 refs). Those are
     * product *listing pages* (`/products/i890451429-....html`), not images —
     * verified: zero URLs on that host end in an image extension.
     *
     * The S3 wildcard predates this pass and stays: 2,801 `media` rows sit on
     * the `s3` disk with an `s3_path` but no origin recorded anywhere in the
     * dump, so the bucket exists in the client's infrastructure even though
     * its hostname does not appear here.
     */
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.ap-southeast-1.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "static-01.daraz.pk" },
      { protocol: "https", hostname: "sg-test-11.slatic.net" },
      { protocol: "https", hostname: "pk-live-21.slatic.net" },
      ...(mediaHost ? [{ protocol: "https", hostname: mediaHost }] : []),
    ],
    // 4:5 product tiles across a 1→4 column grid; no need for the full ladder.
    imageSizes: [256, 384, 512],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    /*
     * Resizing is delegated to Cloudinary's CDN rather than done in-process.
     * See lib/cloudinary-loader.ts for the measurement that forced this:
     * Next's built-in optimizer left 14 of 32 homepage images permanently
     * pending (not failing — queued) on a production build, which is the
     * "blank product tile" symptom reported against this site.
     *
     * `formats` is deliberately NOT set here any more: it only ever applied
     * to the built-in optimizer and is inert under a custom loader. Format
     * negotiation now happens via Cloudinary's `f_auto`, which reads the
     * browser's Accept header and serves AVIF/WebP the same way.
     *
     * `remotePatterns` above still matters — it is enforced independently of
     * the loader, so an undeclared host is still refused.
     */
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
  },
  /*
   * `leva` (the Batch C/D dev-only scene-tuning panel) excluded from
   * production at the module-resolution level.
   *
   * Two lighter approaches were tried and both failed, verified by grepping
   * the actual `.next` output for leva's own error strings ("LEVA:",
   * "LEVA_ERROR") after each: gating only the *render* of a `next/dynamic`
   * component behind `process.env.NODE_ENV === "development"`, and moving
   * the `dynamic(() => import(...))` call itself inside that same
   * conditional. Both still produced a hashed production chunk containing
   * leva's code — `next/dynamic`'s own build-time handling registers the
   * `import()` as a code-split point from the source text, independent of
   * surrounding runtime conditionals, so no amount of restructuring the
   * *application* code around it changes what webpack decides to bundle.
   *
   * Aliasing the package name itself is a different layer entirely: this
   * runs as plain Node.js when `next build` starts, before any bundling, and
   * decides what "leva" resolves to before webpack ever sees a call site.
   * `false` is webpack's convention for "this specifier resolves to nothing"
   * — every `import … from "leva"` in `components/3d/scene-controls.tsx`
   * (the only file that imports it) becomes an import of an empty module in
   * a production build, so leva's own code is never parsed into any chunk,
   * dev-tool-registration side effects included.
   */
  webpack(config, { dev }) {
    if (!dev) {
      config.resolve.alias.leva = false;
    }
    return config;
  },
};

export default nextConfig;
