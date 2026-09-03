"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthField, AuthStagger } from "./auth-field";
import {
  AuthDivider,
  AuthForgotLink,
  AuthSocialButtons,
  AuthSubmitButton,
  AuthSwitchLink,
} from "./auth-shared";
import { useAuth } from "@/lib/auth/auth-context";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** How long the success state is held before the redirect, so the check is actually seen. */
const SUCCESS_HOLD_MS = 600;

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
  const [succeeded, setSucceeded] = useState(false);

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

    // The check is the confirmation the reader acts on, so it needs a beat
    // to register before the route changes out from under it.
    setSubmitting(false);
    setSucceeded(true);
    window.setTimeout(() => router.push(next), SUCCESS_HOLD_MS);
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
        <AuthStagger index={0}>
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
        </AuthStagger>

        <AuthStagger index={1}>
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <div className="mt-3 text-right">
            <AuthForgotLink href="/reset" />
          </div>
        </AuthStagger>

        <AuthStagger index={2}>
          <div className="mt-8">
            <AuthSubmitButton type="submit" loading={submitting} success={succeeded}>
              Sign in
            </AuthSubmitButton>
          </div>
        </AuthStagger>
      </form>

      <AuthStagger index={3}>
        <AuthDivider />
        <AuthSocialButtons />
        <p className="mt-8 font-sans text-[14px] text-charcoal">
          New to Levenon? <AuthSwitchLink href="/signup">Create your account</AuthSwitchLink>
        </p>
      </AuthStagger>
    </>
  );
}
