import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Levenon about a piece, an order or a fit question.",
  alternates: { canonical: "/contact" },
};

/*
 * No address, no landline, no email inbox, no opening hours.
 *
 * None of those exist as data anywhere in this project, and a contact page is
 * precisely the wrong place to invent them: a customer who trusts a made-up
 * address and turns up at it has been actively misled.
 *
 * WhatsApp was that channel until the client brief of 2026-08-25 asked for it
 * hidden sitewide, in favour of the new web order system: checkout now takes
 * a name, phone, email and address directly, and every order gets its own
 * confirmation page plus a live status a customer can check from `/track`
 * without messaging anyone. This page reflects that — it points a reader at
 * the two things that are actually true today (the size guide answers most
 * pre-order questions, and `/track` answers most post-order ones) rather than
 * offering a live-chat channel that no longer exists.
 */
export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Care"
      title="Contact"
      intro="Orders and their status live entirely on this site now — most questions are answered faster here than by asking a person."
    >
      <ContentSection heading="Before you order">
        <p>
          If it is about sizing, the{" "}
          <Link
            href="/size-guide"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            size guide
          </Link>{" "}
          answers most of it, and the measurements there are body measurements
          rather than garment ones. Delivery timing and cost are covered on{" "}
          <Link
            href="/shipping"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Shipping
          </Link>
          .
        </p>
      </ContentSection>

      <ContentSection heading="After you order">
        <p>
          Every order gets its own confirmation page the moment it is placed,
          and its status — confirmed, processing, dispatched, delivered — is
          always current. Find it any time from{" "}
          <Link
            href="/track"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Track order
          </Link>
          {" "}using the number you ordered from.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
