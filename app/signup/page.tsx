import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Levenon account.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

/** No footer, same reasoning as `/login` — see that file's own doc comment. */
export default function SignupPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <AuthSplitLayout>
          <AuthHeading
            title="Join Levenon."
            subtitle="Create an account to save pieces and track orders."
          />
          <SignupForm />
        </AuthSplitLayout>
      </main>
    </>
  );
}
