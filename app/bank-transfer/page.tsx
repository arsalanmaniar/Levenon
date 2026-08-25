import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { BankTransferDetails } from "@/components/cart/bank-transfer-details";

export const metadata: Metadata = {
  title: "Bank Transfer Details",
  description: "Account details for paying a Levenon order by bank transfer.",
  alternates: { canonical: "/bank-transfer" },
};

/**
 * Standalone bank-details page (client brief, 2026-08-26) — named in the
 * footer redesign. The cart drawer already shows the same details inside a
 * modal at checkout; this gives the footer link a real destination without
 * needing to trigger that drawer's modal state from an arbitrary page, which
 * would need global state this codebase doesn't otherwise have a reason to
 * carry. `BankTransferDetails` is presentation-only, so reusing it here is
 * the same component, not a second copy of the account details.
 */
export default function BankTransferPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-lg px-6 py-16 md:py-20">
          <p className="label text-charcoal">Payment</p>
          <h1 className="mt-5 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Bank Transfer Details
          </h1>
          <div className="mt-10">
            <BankTransferDetails />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
