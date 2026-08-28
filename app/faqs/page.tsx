import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FaqAccordion, type FaqCategory } from "@/components/sections/faq-accordion";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to the most common questions about delivery, returns, order tracking, payment, sizing and fabric care at Levenon.",
  alternates: { canonical: "/faqs" },
};

/*
 * Content is the client brief's own literal copy (2026-08-31), including its
 * concrete delivery windows and fees.
 *
 * Flagged, not silently changed: `/shipping` deliberately states no delivery
 * window or fee today — its own doc comment explains why ("no delivery-fee
 * calculation... exists" in this codebase) — and this page's "3–5 working
 * days" / "PKR 200" answers that page's abstention directly. The free-
 * shipping threshold here (PKR 5,000) also doesn't match the placeholder
 * already coded into the cart drawer's `FreeShippingProgress`
 * (`FREE_SHIPPING_THRESHOLD_MINOR`, PKR 10,000). Both are the brief's own
 * literal text, typed as given rather than quietly reconciled — worth the
 * business owner squaring these three numbers against each other before the
 * next pass touches any of them.
 */
const CATEGORIES: FaqCategory[] = [
  {
    id: "delivery",
    title: "Delivery & Shipping",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery 3-5 working days within Pakistan. Express delivery (Karachi/Lahore/Islamabad) 1-2 days.",
      },
      {
        q: "Is delivery free?",
        a: "Free on all orders above PKR 5,000. Below that, a flat PKR 200 delivery charge applies.",
      },
      {
        q: "Do you ship outside Pakistan?",
        a: "International shipping coming soon. Join our newsletter to be notified.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Exchange",
    items: [
      {
        q: "What is your return policy?",
        a: "7-day return window from delivery date. Items must be uncut, unwashed, with original packaging.",
      },
      {
        q: "How do I return an item?",
        a: "Contact us via the Track Order page or email. We'll arrange a pickup from your address.",
      },
      {
        q: "Can I exchange for a different fabric?",
        a: "Yes — exchanges are free within 7 days.",
      },
    ],
  },
  {
    id: "tracking",
    title: "Order Tracking",
    items: [
      {
        q: "How do I track my order?",
        a: "Visit our Track Order page at /track and enter your phone number used at checkout.",
      },
      {
        q: "My tracking shows no updates — what do I do?",
        a: "Allow 24 hours after order confirmation. If still no update, contact support.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Bank transfer (Meezan Bank) and card payment (coming soon). All transactions are secure.",
      },
      {
        q: "How does bank transfer work?",
        a: "Place your order, then transfer the total amount to our account. Orders are confirmed within 2 hours of payment verification.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes — we never store card details. Bank transfers are direct and fully traceable.",
      },
    ],
  },
  {
    id: "product-sizing",
    title: "Product & Sizing",
    items: [
      {
        q: 'What does "unstitched" mean?',
        a: "You receive the fabric panels — front, back, sleeves, dupatta — uncut and unsewn. You take these to your own tailor to stitch to your exact measurements.",
      },
      {
        q: "How much fabric do I get?",
        a: "A standard 3-piece suit includes 4-4.5m shirt fabric, 2.5m dupatta, and 2.5m trouser fabric — enough for most standard sizes.",
      },
      {
        q: "Do you offer a size guide?",
        a: "Yes — our Size Guide is available on every product page. Note: since these are unstitched, the measurements are body guides for your tailor.",
      },
    ],
  },
  {
    id: "care",
    title: "Product Care",
    items: [
      {
        q: "How do I care for my fabric?",
        a: "Dry clean recommended for embroidered pieces. Lawn and cotton: hand wash cold, gentle detergent. Silk and chiffon: dry clean only.",
      },
      {
        q: "Will the colours fade?",
        a: "Our digital prints are colourfast. Hand embroidery colours are natural dyes — avoid direct sunlight for extended periods.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="flex h-[200px] flex-col justify-end border-b border-hairline">
          <div className="mx-auto w-full max-w-shell px-6 pb-8 md:px-12 lg:px-20">
            <Breadcrumbs items={[{ label: "FAQs" }]} />
            <h1 className="mt-4 font-display text-h2 font-extrabold tracking-[-0.02em]">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-body text-charcoal">Everything you need to know.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-20">
          <FaqAccordion categories={CATEGORIES} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
