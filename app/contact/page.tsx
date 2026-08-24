import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/sections/content-page";
import {
  getShopWhatsAppNumber,
  shopWhatsAppUrl,
  SUPPORT_MESSAGE,
  WHATSAPP_ARIA_LABEL,
} from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Levenon about a piece, an order or a fit question.",
  alternates: { canonical: "/contact" },
};

/**
 * Formats the configured digits back into something a person can read and dial
 * — `923142200737` → `+92 314 220 0737`. Display only; every link still uses
 * the raw international digits `wa.me` requires.
 *
 * Falls back to a plain `+`-prefixed string for any length this pattern does
 * not fit, rather than mangling a number from another country.
 */
function formatForDisplay(digits: string): string {
  const match = /^(\d{2})(\d{3})(\d{3})(\d{4})$/.exec(digits);
  if (!match) return `+${digits}`;
  return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

/*
 * No address, no landline, no email, no opening hours.
 *
 * None of those exist as data anywhere in this project, and a contact page is
 * precisely the wrong place to invent them: a customer who trusts a made-up
 * address and turns up at it has been actively misled. WhatsApp is the one
 * channel this shop genuinely runs on — checkout, order confirmation and
 * tracking all already route through it — so that is what this page offers.
 *
 * The number resolves through `lib/whatsapp.ts`, which carries the shop's
 * default and lets `NEXT_PUBLIC_WHATSAPP_NUMBER` override it per deployment.
 * The guard below stays regardless: if that resolution ever yields nothing
 * usable, this renders an honest note instead of `wa.me/undefined`.
 */
export default function ContactPage() {
  const number = getShopWhatsAppNumber();
  const href = shopWhatsAppUrl(SUPPORT_MESSAGE);

  return (
    <ContentPage
      eyebrow="Care"
      title="Contact"
      intro="One channel, answered by the people who cut the cloth. Ask before you order rather than after — it is the cheapest part of the process."
    >
      <ContentSection heading="WhatsApp">
        <p>
          Orders, fit questions, cloth questions, and anything that has gone
          wrong. It is the same thread your order confirmation arrives in, so
          the history stays in one place.
        </p>
        {href && number ? (
          <>
            {/* The number itself, shown as well as linked: a customer may want
                to save it, or message from a different device than the one
                they are browsing on. */}
            <p className="pt-2 font-mono text-lg text-ink">
              {formatForDisplay(number)}
            </p>
            <p className="pt-2">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${WHATSAPP_ARIA_LABEL} — opens in a new tab`}
                className="label inline-flex min-h-[48px] items-center justify-center rounded-full bg-ink px-7 text-paper transition-colors duration-200 ease-state hover:bg-purple-700 active:scale-[0.98] motion-reduce:active:scale-100"
              >
                Chat on WhatsApp
              </a>
            </p>
          </>
        ) : (
          <p className="pt-2 text-charcoal">
            The shop&rsquo;s WhatsApp number is not configured on this
            deployment yet.
          </p>
        )}
      </ContentSection>

      <ContentSection heading="Before you message">
        <p>
          If it is about sizing, the{" "}
          <Link
            href="/size-guide"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            size guide
          </Link>{" "}
          answers most of it, and the measurements there are body measurements
          rather than garment ones.
        </p>
        <p>
          If it is about an order already placed, have the number you messaged
          from to hand and check{" "}
          <Link
            href="/track"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Track order
          </Link>{" "}
          first.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
