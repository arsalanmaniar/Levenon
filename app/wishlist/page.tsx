import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { WishlistContents } from "@/components/wishlist/wishlist-contents";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Saved pieces",
  description: "Pieces you have saved from the Levenon collection.",
  alternates: { canonical: "/wishlist" },
  // Session-scoped and personal — there is nothing here for a crawler to index.
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-shell px-6 py-16 md:px-12 lg:px-20 md:py-20">
          <Breadcrumbs items={[{ label: "Wishlist" }]} />
          <p className="mt-6 label text-charcoal">Saved</p>
          <h1 className="mt-5 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Your saved pieces
          </h1>
          <WishlistContents />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
