"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthField } from "./auth-field";
import { AuthDivider, AuthSocialButtons, AuthSubmitButton } from "./auth-shared";
import { useAuth } from "@/lib/auth/auth-context";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * `next` (client brief, 2026-09-02, Item E — "Protected Wishlist") — the
 * wishlist's own "Sign in" CTA links here as `/login?next=/wishlist`, so a
 * customer who got bounced off a page they weren't signed in for lands
 * back on it, not on the homepage, after signing in.
 */
export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Enter your password";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const result = login(email, password);

    if (!result.ok) {
      setSubmitting(false);
      setErrors({ password: result.error });
      return;
    }

    router.push(next);
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10">
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />

        <div className="mt-6">
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
        </div>

        <div className="mt-3 text-right">
          <Link
            href="/reset"
            className="font-mono text-[11px] text-purple-500 transition-colors duration-200 ease-state hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-8">
          <AuthSubmitButton type="submit" loading={submitting}>
            Sign in
          </AuthSubmitButton>
        </div>
      </form>

      <AuthDivider />
      <AuthSocialButtons />

      <p className="mt-8 font-sans text-[14px] text-charcoal">
        New to Levenon?{" "}
        <Link
          href="/signup"
          className="text-purple-500 transition-colors duration-200 ease-state hover:underline"
        >
          Create your account →
        </Link>
      </p>
    </>
  );
}
