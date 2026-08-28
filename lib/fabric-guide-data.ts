/**
 * Fabric Guide copy (client brief, 2026-08-31) — the second of the pass's
 * two new features. General textile facts (origin, hand, care, occasion),
 * not store policy — unlike a delivery window or a price, these don't
 * depend on anything this codebase would need to "back" operationally, so
 * they carry none of the honesty caveats a fabricated shipping estimate
 * would. Slugs match `Category.slug` in the live catalogue exactly, so a
 * caller can join this against real products and real category names
 * without a second mapping table.
 */
export type FabricGuideEntry = {
  slug: string;
  /** 1 (airy) – 3 (heavy) — drives the swatch's line density, nothing else. */
  weight: 1 | 2 | 3;
  origin: string;
  texture: string;
  care: string;
  bestFor: string;
};

export const FABRIC_GUIDE: FabricGuideEntry[] = [
  {
    slug: "lawn",
    weight: 1,
    origin:
      "A fine, lightweight cotton weave — the name traces back to Lawn, France, long since adopted as a South Asian summer staple.",
    texture: "Crisp, breathable, almost paper-light against the skin.",
    care: "Hand wash cold or a gentle machine cycle; iron on a warm setting while still slightly damp.",
    bestFor: "Daily wear and warm-weather formal occasions — the most breathable fabric in the edit.",
  },
  {
    slug: "cotton",
    weight: 1,
    origin: "A natural fibre spun and woven from the cotton plant, worn across the region for generations.",
    texture: "Soft, matte, substantial without being heavy.",
    care: "Machine washable and colourfast; tumble dry low or line dry.",
    bestFor: "Daily wear and work — the easiest fabric here to live in.",
  },
  {
    slug: "chiffon",
    weight: 2,
    origin: "A sheer, lightly textured plain weave, here in a fine silk-blend.",
    texture: "Airy and fluid, with a soft crepe-like hand and natural drape.",
    care: "Dry clean only — the sheer weave snags and puckers in a machine.",
    bestFor: "Formal wear — the drape reads dressier than lawn without silk's weight.",
  },
  {
    slug: "silk",
    weight: 3,
    origin: "A natural protein fibre, woven from silk filament — the richest base cloth in the edit.",
    texture: "Smooth, lustrous, with real weight and a cool hand.",
    care: "Dry clean only; keep away from direct sunlight and perfume, both of which mark raw silk.",
    bestFor: "Weddings and formal occasions — the richest fabric here.",
  },
  {
    slug: "organza",
    weight: 3,
    origin: "A crisp, sheer plain weave, historically silk, prized for holding its own shape.",
    texture: "Stiff and structured rather than fluid — it stands away from the body.",
    care: "Dry clean only; store flat or on a padded hanger to keep its structure.",
    bestFor: "Wedding and formal wear where volume and structure matter more than drape.",
  },
  {
    slug: "net",
    weight: 2,
    origin: "An open, meshed weave used for dupattas and overlays rather than full panels.",
    texture: "Sheer and delicate, with a visibly open structure.",
    care: "Hand wash cold or dry clean; snags easily, so handle gently.",
    bestFor: "Wedding wear, almost always layered over another fabric rather than worn alone.",
  },
];
