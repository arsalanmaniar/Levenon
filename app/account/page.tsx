import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AccountView } from "@/components/auth/account-view";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your Levenon account.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-shell px-6 py-16 md:px-12 lg:px-20 md:py-20">
          <Breadcrumbs items={[{ label: "My Account" }]} />
          <p className="mt-6 label text-charcoal">Account</p>
          <h1 className="mt-5 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            My Account
          </h1>
          <AccountView />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
