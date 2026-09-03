"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField } from "./auth-field";
import { AuthDivider, AuthSocialButtons, AuthSubmitButton } from "./auth-shared";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/cn";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type Strength = { score: 0 | 1 | 2 | 3; label: string; barClass: string; textClass: string };

/**
 * Password strength, scored on what actually makes a password hard to
 * guess rather than on a single rule: length past the 8-character minimum,
 * and variety across character classes. Deliberately coarse — three visible
 * bands (the brief's own red → amber → green), not a false-precision
 * percentage, since this is guidance for a person, not a security control.
 *
 * `--amber` is the token this codebase already reserves for urgency/warning
 * (see `low-stock-badge.tsx`), so the middle band uses it rather than
 * introducing a fourth accent colour.
 */
function scorePassword(password: string): Strength {
  if (!password) {
    return { score: 0, label: "", barClass: "bg-hairline", textClass: "text-charcoal" };
  }

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  const points = (password.length >= 8 ? 1 : 0) + (password.length >= 12 ? 1 : 0) + classes;

  if (points <= 2) return { score: 1, label: "Weak", barClass: "bg-error", textClass: "text-error" };
  if (points <= 4) return { score: 2, label: "Fair", barClass: "bg-amber", textClass: "text-amber" };
  return { score: 3, label: "Strong", barClass: "bg-success", textClass: "text-success" };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = scorePassword(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((band) => (
          <span
            key={band}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-colors duration-300 ease-state",
              band <= strength.score ? strength.barClass : "bg-hairline",
            )}
          />
        ))}
      </div>
      {/* `aria-live` so a screen-reader user gets the same feedback the bar
          gives visually — the bars themselves are decorative. */}
      <p aria-live="polite" className={cn("mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em]", strength.textClass)}>
        {strength.label}
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

    router.push("/");
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10">
        <AuthField
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />

        <div className="mt-6">
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
        </div>

        <div className="mt-6">
          <AuthField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <PasswordStrengthBar password={password} />
        </div>

        <div className="mt-6">
          <AuthField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
          />
        </div>

        <div className="mt-8">
          <AuthSubmitButton type="submit" loading={submitting}>
            Create account
          </AuthSubmitButton>
        </div>
      </form>

      <AuthDivider />
      <AuthSocialButtons />

      <p className="mt-8 font-sans text-[14px] text-charcoal">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-purple-500 transition-colors duration-200 ease-state hover:underline"
        >
          Sign in →
        </Link>
      </p>
    </>
  );
}
