"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { AuthField, AuthStagger } from "./auth-field";
import {
  AuthDivider,
  AuthSocialButtons,
  AuthSubmitButton,
  AuthSwitchLink,
} from "./auth-shared";
import { useAuth } from "@/lib/auth/auth-context";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const SUCCESS_HOLD_MS = 600;

/**
 * Four strength bands, each with the brief's own literal colour. Written as
 * hex rather than the `--error`/`--amber`/`--purple-500`/`--success` tokens
 * they happen to match: three of those four remap under `[data-theme="dark"]`
 * (purple-500 in particular becomes purple-300's value), and a strength
 * meter's whole job is that red, amber and green mean the same thing every
 * time they are seen.
 */
const STRENGTH_BANDS = [
  { label: "Weak", colour: "#DC2626" },
  { label: "Fair", colour: "#D97706" },
  { label: "Good", colour: "#7C2AE8" },
  { label: "Strong", colour: "#2D7A4F" },
] as const;

/**
 * Scored on what actually makes a password hard to guess — length past the
 * 8-character minimum, and variety across character classes — rather than
 * on a single rule. Returns 0 (nothing typed) through 4.
 */
function scorePassword(password: string): number {
  if (!password) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  const points = (password.length >= 8 ? 1 : 0) + (password.length >= 12 ? 1 : 0) + classes;
  if (points <= 2) return 1;
  if (points <= 3) return 2;
  if (points <= 4) return 3;
  return 4;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const score = scorePassword(password);
  if (score === 0) return null;

  const band = STRENGTH_BANDS[score - 1];

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => {
          const filled = segment <= score;
          return (
            <m.span
              key={segment}
              className="h-0.5 flex-1 origin-left rounded-[1px]"
              style={{ backgroundColor: filled ? band.colour : "#EAE8E2" }}
              initial={false}
              animate={{ scaleX: filled ? 1 : 1, opacity: filled ? 1 : 0.6 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            />
          );
        })}
      </div>
      {/* `aria-live` so a screen-reader user gets the same feedback the bars
          give visually — the bars themselves are decorative. */}
      <p
        aria-live="polite"
        className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: band.colour }}
      >
        {band.label}
      </p>
    </div>
  );
}

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Errors = {};
    if (!name.trim()) nextErrors.name = "Enter your full name";
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords don't match";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    // Auto-login after signup, per the brief — `signup()` itself sets the
    // session, there is no separate "now go log in" step.
    const result = signup(name, email, password);

    if (!result.ok) {
      setSubmitting(false);
      setErrors({ email: result.error });
      return;
    }

    setSubmitting(false);
    setSucceeded(true);
    window.setTimeout(() => router.push("/"), SUCCESS_HOLD_MS);
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
        <AuthStagger index={0}>
          <AuthField
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
        </AuthStagger>

        <AuthStagger index={1}>
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
        </AuthStagger>

        <AuthStagger index={2}>
          <AuthField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <PasswordStrengthBar password={password} />
        </AuthStagger>

        <AuthStagger index={3}>
          <AuthField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
          />
        </AuthStagger>

        <AuthStagger index={4}>
          <div className="mt-8">
            <AuthSubmitButton type="submit" loading={submitting} success={succeeded}>
              Create account
            </AuthSubmitButton>
          </div>
        </AuthStagger>
      </form>

      <AuthStagger index={5}>
        <AuthDivider />
        <AuthSocialButtons />
        <p className="mt-8 font-sans text-[14px] text-charcoal">
          Already have an account? <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
        </p>
      </AuthStagger>
    </>
  );
}
