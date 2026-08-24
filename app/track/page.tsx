import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { TrackForm } from "@/components/orders/track-form";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Find an order placed with Levenon using your WhatsApp number.",
  alternates: { canonical: "/track" },
  // Personal order data. Nothing on this page belongs in an index, and a
  // crawler following links out of it has no business here either.
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        {/*
          A centred column, not a half-grid. The page has one field and one
          result list; laid out on the twelve-column shell it left the entire
          right-hand side empty and read as unfinished.
        */}
        <div className="mx-auto max-w-lg px-6 py-16 md:py-20">
          <p className="label text-charcoal">Orders</p>
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Track an order
          </h1>
          <p className="mt-6 max-w-measure text-sm leading-relaxed text-charcoal">
            Orders are placed over WhatsApp, so the number you messaged from
            is the reference.
          </p>
          <TrackForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
