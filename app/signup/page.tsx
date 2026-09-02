import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Levenon account.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto flex min-h-[180px] max-w-md flex-col justify-end px-6 pb-2 pt-16">
          <p className="label text-charcoal">Account</p>
          <h1 className="mt-4 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Join Levenon.
          </h1>
        </div>
        <div className="mx-auto max-w-md px-6 pb-24">
          <SignupForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
