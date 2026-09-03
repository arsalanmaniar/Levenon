import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Levenon account.",
  alternates: { canonical: "/login" },
  // A form page with no content of its own to index.
  robots: { index: false, follow: false },
};

/**
 * No `SiteFooter` here, deliberately (client brief, 2026-09-03's split-
 * screen redesign): the brand panel runs the full height of the viewport,
 * and a four-column footer below it would break that edge-to-edge read and
 * push the form off-centre. Every other route keeps its footer.
 */
export default function LoginPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <AuthSplitLayout>
          <AuthHeading title="Welcome back." subtitle="Sign in to your Levenon account." />
          {/* `LoginForm` reads `useSearchParams()` for `?next=` — the App
              Router requires that inside a `Suspense` boundary, and the
              whole boundary is client-rendered as a result. The heading
              above deliberately sits outside it so the page still ships
              real content in its SSR HTML. The fallback reserves the form's
              own height so nothing shifts when it hydrates in. */}
          <Suspense fallback={<div aria-hidden="true" className="mt-10 h-[420px]" />}>
            <LoginForm />
          </Suspense>
        </AuthSplitLayout>
      </main>
    </>
  );
}
