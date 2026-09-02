import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Levenon account password.",
  alternates: { canonical: "/reset" },
  robots: { index: false, follow: false },
};

/**
 * Placeholder (client brief, 2026-09-02 names this explicitly as one:
 * "'Forgot password?' link (placeholder /reset)") — there is no email
 * service behind this prototype's auth, so there is nothing real to build
 * here yet. A real page rather than a 404: this codebase's own rule is
 * every link resolves to something real (see `site-footer.tsx`'s note on
 * the same), and "real" for a placeholder means an honest one, not a
 * fabricated reset flow that would silently do nothing.
 */
export default function ResetPasswordPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto flex min-h-[180px] max-w-md flex-col justify-end px-6 pb-2 pt-16">
          <p className="label text-charcoal">Account</p>
          <h1 className="mt-4 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Reset password.
          </h1>
        </div>
        <div className="mx-auto max-w-md px-6 pb-24">
          <p className="mt-6 text-body leading-relaxed text-charcoal">
            Password reset isn&rsquo;t wired up yet — this prototype&rsquo;s accounts
            don&rsquo;t have an email service behind them. In the meantime, get in
            touch and we&rsquo;ll sort it out by hand.
          </p>
          <Link
            href="/contact"
            className="label mt-8 inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
          >
            Contact us
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
