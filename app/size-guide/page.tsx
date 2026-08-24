import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Size guide",
  description:
    "Body measurements for unstitched three-piece suits from Levenon, in centimetres and inches.",
  alternates: { canonical: "/size-guide" },
};

/**
 * The same measurements the PDP's `SizeGuide` modal shows.
 *
 * Duplicated as a plain table rather than reusing that component: it is a
 * focus-trapping client modal built to be opened from beside a size selector,
 * and mounting it as the body of a static page would ship modal machinery to
 * render a table. The numbers are the ones that matter and they live in one
 * obvious place in each file — if they ever change, both need editing, which
 * is the trade accepted here.
 */
const SIZES = [
  { size: "XS", chest: 86, waist: 71, hips: 89 },
  { size: "S", chest: 91, waist: 76, hips: 94 },
  { size: "M", chest: 97, waist: 81, hips: 99 },
  { size: "L", chest: 104, waist: 89, hips: 107 },
  { size: "XL", chest: 112, waist: 97, hips: 114 },
] as const;

/** Centimetres → inches, rounded to the nearest half inch. */
function toInches(cm: number): string {
  return (Math.round((cm / 2.54) * 2) / 2).toFixed(1);
}

export default function SizeGuidePage() {
  return (
    <ContentPage
      eyebrow="Care"
      title="Size guide"
      intro="These are body measurements, not garment measurements — the cloth arrives uncut, so your tailor works from your body and adds their own ease."
    >
      <ContentSection heading="Body measurements">
        {/* Scrolls inside its own box rather than pushing the page wide on a
            phone — the table has four columns and a 320px viewport does not
            have room for them. */}
        <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th scope="col" className="label py-3 pr-4 text-charcoal">Size</th>
                <th scope="col" className="label py-3 pr-4 text-charcoal">Chest</th>
                <th scope="col" className="label py-3 pr-4 text-charcoal">Waist</th>
                <th scope="col" className="label py-3 text-charcoal">Hips</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((row) => (
                <tr key={row.size} className="border-b border-hairline last:border-b-0">
                  <th scope="row" className="label py-4 pr-4 text-ink">{row.size}</th>
                  <td className="py-4 pr-4 font-mono text-sm text-ink">
                    {row.chest} cm <span className="text-charcoal">/ {toInches(row.chest)} in</span>
                  </td>
                  <td className="py-4 pr-4 font-mono text-sm text-ink">
                    {row.waist} cm <span className="text-charcoal">/ {toInches(row.waist)} in</span>
                  </td>
                  <td className="py-4 font-mono text-sm text-ink">
                    {row.hips} cm <span className="text-charcoal">/ {toInches(row.hips)} in</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentSection>

      <ContentSection heading="How to measure">
        <p>
          Measure over the underclothes you would actually wear, with the tape
          level and snug but not pulled tight. Chest at the fullest point,
          waist at the narrowest, hips at the fullest.
        </p>
        <p>
          If you fall between two sizes, give your tailor the larger set. Cloth
          can be taken in; it cannot be added back.
        </p>
      </ContentSection>

      <ContentSection heading="How much cloth you get">
        <p>
          Every piece is a three-piece suit — shirt, trouser and dupatta — cut
          as unstitched lengths. The exact composition of each is listed under
          &ldquo;Construction&rdquo; on the piece&rsquo;s own page.
        </p>
        <p>
          Not sure a length will work for your height?{" "}
          <Link
            href="/contact"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Ask before you order
          </Link>
          .
        </p>
      </ContentSection>
    </ContentPage>
  );
}
