import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "How Levenon orders are dispatched across Pakistan, and how delivery is agreed over WhatsApp.",
  alternates: { canonical: "/shipping" },
};

/*
 * Deliberately states no delivery window, courier name or fee.
 *
 * None of those exist anywhere in this codebase — there is no delivery-fee
 * calculation (see the placeholder note in `cart-drawer.tsx`) and no courier
 * integration. Inventing "3–5 working days" or a rate card here would put a
 * number in front of a customer that nothing in the system can honour, which
 * is worse than saying plainly that it is agreed per order. The page instead
 * documents the process that genuinely exists: checkout hands off to WhatsApp
 * and the terms are settled there.
 */
export default function ShippingPage() {
  return (
    <ContentPage
      eyebrow="Care"
      title="Shipping"
      intro="Orders are confirmed over WhatsApp, and that is where delivery is arranged — so the terms are agreed with you rather than assumed."
    >
      <ContentSection heading="How an order is placed">
        <p>
          Everything in the bag goes to WhatsApp at checkout, itemised. Nothing
          is charged on this site; you confirm the order in the chat, and the
          dispatch and payment terms are agreed there.
        </p>
      </ContentSection>

      <ContentSection heading="Where we send">
        <p>
          Anywhere in Pakistan. Courier charges and timing vary by city and are
          quoted when you confirm — this is a small-run shop rather than a
          fulfilment network with one flat table, and quoting a single figure
          for every address would only be right for some of them.
        </p>
        <p>
          For an address outside Pakistan, ask in the chat before confirming and
          we will tell you whether we can send it.
        </p>
      </ContentSection>

      <ContentSection heading="Once it has gone">
        <p>
          You can check the status of a placed order any time from{" "}
          <Link
            href="/track"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Track order
          </Link>
          , using the number you messaged from.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
