"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * `/account` (client brief, 2026-09-02, Item F — placeholder). Gated the
 * same way `WishlistContents` is: nothing renders until the mount-time
 * localStorage read resolves, so a real signed-in reader never sees a
 * "sign in" flash first.
 */
export function AccountView() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return (
      <div className="mt-16 flex flex-col items-center py-12 text-center">
        <p className="max-w-[36ch] text-body leading-relaxed text-charcoal">
          Sign in to view your account.
        </p>
        <Link
          href="/login?next=/account"
          className="label mt-8 inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-md">
      <dl className="space-y-6 border-t border-hairline pt-6">
        <div>
          <dt className="label text-charcoal">Name</dt>
          <dd className="mt-1 text-body text-ink">{user.name}</dd>
        </div>
        <div>
          <dt className="label text-charcoal">Email</dt>
          <dd className="mt-1 text-body text-ink">{user.email}</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-3 border-t border-hairline pt-8 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled
          title="Not built yet"
          className="label inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-full border border-hairline px-6 text-charcoal"
        >
          Edit profile
        </button>
        <Link
          href="/track"
          className="label inline-flex min-h-[44px] items-center justify-center rounded-full border border-hairline px-6 text-ink transition-colors duration-200 ease-state hover:border-ink"
        >
          My Orders
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="label inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
