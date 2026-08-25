import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "About",
  description: "What Levenon is, and why the cloth ships uncut.",
  alternates: { canonical: "/about" },
};

/**
 * "About" — named in the client brief's footer redesign (2026-08-26) but not
 * previously built; a prior pass's footer comment explicitly avoided this
 * link because it had no route or content behind it. This gives it a real,
 * honest one rather than linking to `#` — same `ContentPage` shell as
 * `/contact`, `/returns` and `/shipping`, so it reads as the same site.
 */
export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Levenon"
      title="About"
      intro="A small-run edit of unstitched cloth — the cutting and the fit stay with your own tailor, not with us."
    >
      <ContentSection heading="What we do">
        <p>
          We choose the fabric, set the embroidery, and stop there. Every
          piece ships as raw cloth — three pieces, uncut: shirt, trouser and
          dupatta — so the fit is decided by the tailor who knows your
          measurements, not by a size label.
        </p>
      </ContentSection>

      <ContentSection heading="Why unstitched">
        <p>
          A finished garment fits one body. Cloth fits whoever cuts it. That
          is the whole reasoning behind selling suits this way, and it is
          also why the size guide gives body measurements rather than
          garment sizes — there is no finished garment to measure.
        </p>
      </ContentSection>

      <ContentSection heading="Small runs">
        <p>
          Six cloths a season, cut in small numbers. When a piece is gone
          from the rail, it is gone — the next edit is a different set of
          fabrics, not a restock of this one.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
