"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { useAuth } from "@/lib/auth/auth-context";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const [shakeSignal, setShakeSignal] = useState(0);
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
      setShakeSignal((current) => current + 1);
      return;
    }

    setSubmitting(true);
    // Auto-login after signup, per the brief — `signup()` itself sets the
    // session, there is no separate "now go log in" step.
    const result = signup(name, email, password);

    if (!result.ok) {
      setSubmitting(false);
      setErrors({ email: result.error });
      setShakeSignal((current) => current + 1);
      return;
    }

    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
      <FormField
        label="Full name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        shakeSignal={shakeSignal}
      />
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
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        shakeSignal={shakeSignal}
      />
      <FormField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={errors.confirmPassword}
        shakeSignal={shakeSignal}
      />

      <ShimmerAction type="submit" disabled={submitting} className="w-full">
        Create account
      </ShimmerAction>

      <p className="text-center text-body text-charcoal">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-ink underline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500"
        >
          Sign in →
        </Link>
      </p>
    </form>
  );
}
