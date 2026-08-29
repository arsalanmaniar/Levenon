# Hero campaign photography — drop-in slot

This folder is empty as of this writing (2026-09-02) — no campaign assets have
been supplied yet. There is no wide cinematic fashion-campaign photography
anywhere in this project, and the tools available to build this site cannot
generate one, so the hero currently runs on real catalogue garment
photography, shown as a bounded editorial panel rather than stretched into a
landscape banner (see `components/sections/hero-slider.tsx` and
`hero-slider-client.tsx`).

The moment the real shoot lands, drop files here using this exact naming
convention and the hero switches to them automatically — **no code change
required** (`lib/server/hero-assets.ts` looks for exactly these names on
every request):

```
slide-1-desktop.jpg   slide-1-mobile.jpg   (optional)
slide-2-desktop.jpg   slide-2-mobile.jpg
slide-3-desktop.jpg   slide-3-mobile.jpg
slide-4-desktop.jpg   slide-4-mobile.jpg
```

## Delivery — pre-optimise before dropping the file in

This project's image pipeline resizes and re-encodes catalogue photography
through Cloudinary at request time, but that only works for images actually
hosted on Cloudinary. A local file under `public/images/hero/` ships to
every visitor as the **exact bytes supplied** — no server-side resizing, no
format negotiation, same file to a phone and a 4K monitor (confirmed:
Next's built-in optimizer is unavailable in this project's `custom` loader
mode). So the compression and sizing work that would normally happen
automatically has to happen **before** the file is dropped in:

- **Desktop:** ~1920–2560px on the long edge, exported as a compressed JPEG
  (or WebP) around **150–350 KB**. Do not deliver an unedited multi-MB
  camera/RAW export.
- **Mobile:** ~1080–1350px on the long edge, similarly compressed.
- **Format:** JPEG is the safe default; WebP if the source supports it
  cleanly.

`.jpeg`, `.png` and `.webp` are all recognised too. `-mobile` is optional —
if it's missing, the desktop asset is used on every breakpoint. Supply a
dedicated mobile crop whenever the desktop composition would lose the model
or the garment when `object-cover`ed into a portrait frame; the rule per the
final asset contract is **use a real mobile asset rather than fixing a bad
crop with a layout change.**

## What happens once a slide's asset exists

That slide's real hero visual becomes the campaign photo, full-bleed,
nothing bounding or overlaying it beyond a minimal readability gradient
confined to the bottom third — the campaign image is the primary visual,
never a panel in front of it. A slow, gentle Ken Burns scale (~1 → 1.035)
and the same 900ms crossfade/y-drift the rest of the slider uses apply
automatically; nothing else about the slider changes. A slide with no asset
present keeps running the bounded real-product fallback exactly as today —
each slide resolves independently, so a partial delivery (e.g. only
slide 1 and slide 2 supplied) is fine.

## Brief for the photography

- **Aspect:** ideally 16:9–21:9 for `-desktop`, close to 4:5–3:4 for
  `-mobile`. `object-cover` is what renders these — use `cover` framing only
  where the shoot was composed for it (subject placed with real crop
  tolerance top/bottom); don't submit a composition that depends on being
  seen uncropped.
- **Subject:** an actual garment or model wearing one, every slide — this is
  a fashion campaign hero, not an abstract background. See the sequence
  below.
- **Palette:** black / off-white / deep purple (`#0B0B0D` / `#FBFAF8` /
  `#7C2AE8`), consistent with the rest of the site. Purple as a rim light or
  reflection accent, never a full colour wash. All four images should read
  as one campaign, not four unrelated shoots.
- **Mood:** dramatic studio or directional lighting, deep shadows, minimal
  environment — a luxury editorial, not ecommerce catalogue lighting. Stable
  and expensive-feeling, not busy — the site's own Ken Burns motion is
  deliberately gentle for this reason.
- **Negative space:** enough of it, on one side or across the bottom third,
  for a headline + subtext + one CTA to sit over the image without a heavy
  overlay doing the readability work for a busy composition.

## Campaign sequence

| Slide | Name | Composition |
|---|---|---|
| 1 | **The Look** | Premium fashion campaign shot — clothing clearly, unmistakably visible. Model to one side, negative space opposite for the headline. |
| 2 | **The Fabric** | Close-up textile / embroidery / craftsmanship detail — tactile, directional light, subtle purple reflection. |
| 3 | **The Silhouette** | Full-body fashion-editorial composition, minimal studio/architectural backdrop, wide cinematic framing. |
| 4 | **The Atelier** | Craftsmanship, garment detail, or a garment caught in soft movement — the clothing must stay clearly recognisable. |

Until these land, `hero-slider.tsx` maps each of the four slides above onto a
real, already-photographed product from the catalogue and a matching
bounded-panel treatment (`portrait` / `closeup` / `full` / `motion`) — see
that file for exactly which product backs which slide today.
