# Hero campaign photography — drop-in slot

**As of 2026-08-31, this folder holds real catalogue photography, not a final
campaign shoot.** There is still no wide cinematic fashion-campaign
photography anywhere in this project, and no image-generation tool is
connected in this environment (checked directly — no Hugging Face MCP server
is configured; see `hero-slider.tsx`'s own doc comment). Five real,
already-photographed catalogue products were downloaded from Cloudinary
straight into this folder as an interim full-bleed background, per the
client brief's own explicit fallback instruction. They are portrait
ecommerce photographs, not landscape campaign shoots, so `object-cover`
crops them on a wide desktop viewport — expected, disclosed, not hidden.

Current files: `slide-1-desktop.jpg` through `slide-5-desktop.jpg`, no
`-mobile` variants supplied (the desktop asset serves every breakpoint).

The moment a real shoot lands, replace these files using this exact naming
convention and the hero switches to them automatically — **no code change
required** (`lib/server/hero-assets.ts` looks for exactly these names on
every request):

```
slide-1-desktop.jpg   slide-1-mobile.jpg   (optional)
slide-2-desktop.jpg   slide-2-mobile.jpg
slide-3-desktop.jpg   slide-3-mobile.jpg
slide-4-desktop.jpg   slide-4-mobile.jpg
slide-5-desktop.jpg   slide-5-mobile.jpg
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
or the garment when `object-cover`ed into a portrait frame.

## What happens once a slide's asset exists

That slide's real hero visual becomes the full-bleed background — this is
now the hero's *only* treatment (the earlier bounded-panel fallback design
was retired this pass in favour of a full-bleed-always approach), with a
right-weighted dark overlay on desktop and a bottom-weighted one on mobile
for text readability, plus a slow Ken Burns scale. Each slide resolves
independently — a partial delivery (e.g. only slide 1 replaced with real
campaign photography) is fine.

## Brief for real campaign photography, when it's ready to shoot

- **Aspect:** ideally 16:9–21:9 for `-desktop`, close to 4:5–3:4 for
  `-mobile`. `object-cover` is what renders these — use `cover` framing only
  where the shoot was composed for it (subject placed with real crop
  tolerance top/bottom); don't submit a composition that depends on being
  seen uncropped.
- **Subject:** an actual garment or model wearing one, every slide — this is
  a fashion campaign hero, not an abstract background.
- **Palette:** black / off-white / deep purple (`#0B0B0D` / `#FBFAF8` /
  `#7C2AE8`), consistent with the rest of the site. Purple as a rim light or
  reflection accent, never a full colour wash. All five images should read
  as one campaign, not five unrelated shoots.
- **Mood:** dramatic studio or directional lighting, deep shadows, minimal
  environment — a luxury editorial, not ecommerce catalogue lighting.
- **Negative space:** enough of it toward the right edge (where the text
  sits — see `hero-slider-client.tsx`) for a label + headline + subtext +
  CTA to sit over the image without a heavy overlay doing the readability
  work for a busy composition.

## Current sequence

| Slide | Label | Interim source (real catalogue product) |
|---|---|---|
| 1 | New Collection — "Edit 01" | Monsoon Blooms Chikankari |
| 2 | Hand Embroidery — "Worked By Hand" | Adda Work Chiffon Suit |
| 3 | Limited Time Offer — "Eid Collection" | Sequence Net Suit |
| 4 | Just Arrived — "Festive Edit" | Handwork Silk Suit |
| 5 | The Atelier — "The Cloth, Before The Cut" | Scifflie Lawn Suit |

See `hero-slider.tsx` for the live copy, CTA links, and the badge/countdown
special-cases on slides 3 and 4.
