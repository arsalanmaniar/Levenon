import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Levenon account.",
  alternates: { canonical: "/login" },
  // A form page with no content of its own to index.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto flex min-h-[180px] max-w-md flex-col justify-end px-6 pb-2 pt-16">
          <p className="label text-charcoal">Account</p>
          <h1 className="mt-4 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Welcome back.
          </h1>
        </div>
        <div className="mx-auto max-w-md px-6 pb-24">
          {/* `LoginForm` reads `useSearchParams()` for `?next=` — the App
              Router requires that inside a `Suspense` boundary. */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
