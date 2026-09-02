"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { ShimmerAction } from "@/components/ui/shimmer-button";
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
  const [shakeSignal, setShakeSignal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Enter your password";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setShakeSignal((current) => current + 1);
      return;
    }

    setSubmitting(true);
    const result = login(email, password);

    if (!result.ok) {
      setSubmitting(false);
      setErrors({ password: result.error });
      setShakeSignal((current) => current + 1);
      return;
    }

    router.push(next);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
        shakeSignal={shakeSignal}
        className="font-mono"
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        shakeSignal={shakeSignal}
      />

      <div className="flex justify-end">
        <Link
          href="/reset"
          className="label text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
        >
          Forgot password?
        </Link>
      </div>

      <ShimmerAction type="submit" disabled={submitting} className="w-full">
        Sign in
      </ShimmerAction>

      <p className="text-center text-body text-charcoal">
        New to Levenon?{" "}
        <Link
          href="/signup"
          className="text-ink underline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500"
        >
          Create account →
        </Link>
      </p>
    </form>
  );
}
