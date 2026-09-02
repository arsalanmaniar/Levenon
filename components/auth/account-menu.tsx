"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Nav account control (client brief, 2026-09-02, Item D) — "Sign in" when
 * signed out, a 28px purple initial circle with a click-opened dropdown
 * when signed in. Lighter than `useModalBehaviour` (no scroll lock, no
 * `inert` sweep of the rest of the page) deliberately: that hook is for
 * genuine modal surfaces (the cart drawer, the mobile nav overlay); this is
 * a small anchored menu in the same family as `NavDropdown`'s hover panels,
 * just click-triggered instead of hover, so it gets the lighter
 * click-outside + Escape treatment those don't need either.
 */
export function AccountMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSignOut = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  // Mounted gate — same reasoning as `ThemeToggle`'s own: `isLoading` is
  // only true for the first render before the localStorage read resolves,
  // and rendering "Sign in" during that window would flash and then swap
  // to the avatar for anyone actually signed in.
  if (isLoading) {
    return <span aria-hidden="true" className="inline-block h-7 w-16" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="label inline-flex min-h-[44px] items-center text-ink transition-colors duration-200 ease-state hover:text-purple-500"
      >
        Sign in
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account menu — ${user.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 font-mono text-[12px] font-semibold text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-3 w-56 border border-hairline bg-paper py-2 shadow-[0_20px_40px_rgb(var(--ink-rgb)/0.1)]"
          >
            <p className="truncate px-4 py-2 text-xs text-charcoal">{user.email}</p>
            <div className="border-t border-hairline" />
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink transition-colors duration-200 ease-state hover:bg-hairline/40 hover:text-purple-500"
            >
              My Account
            </Link>
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink transition-colors duration-200 ease-state hover:bg-hairline/40 hover:text-purple-500"
            >
              My Orders
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink transition-colors duration-200 ease-state hover:bg-hairline/40 hover:text-purple-500"
            >
              Saved
            </Link>
            <div className="border-t border-hairline" />
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full px-4 py-2.5 text-left text-sm text-ink transition-colors duration-200 ease-state hover:bg-hairline/40 hover:text-purple-500"
            >
              Sign out
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
