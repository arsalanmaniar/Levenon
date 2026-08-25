"use client";

import { useState } from "react";
import { PaymentModal } from "@/components/cart/payment-modal";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/cn";

/** The ring from the wordmark's "e" — same construction used for every empty/success state on the site. */
function Ring() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="h-16 w-16 text-purple-500"
    >
      <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
      <circle cx="60" cy="60" r="26" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="5 7" />
    </svg>
  );
}

/**
 * "Notify Me" (client brief, 2026-08-26) — replaces "Add to Bag" on a
 * sold-out product. `PaymentModal` is reused as the generic modal shell it
 * already is (title + children), the same component the cart's checkout and
 * bank-details panels use — not a second modal implementation.
 */
export function NotifyMe({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "submitting" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function close() {
    setOpen(false);
    // Reset after the close animation has room to finish, so the modal
    // never visibly flashes back to the form while it's fading out.
    window.setTimeout(() => {
      setStatus("form");
      setEmail("");
      setError(null);
    }, 300);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailValid) return;

    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId, productName }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed (${response.status})`);
      }
      setStatus("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <>
      <ShimmerAction
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[56px] w-full py-4"
      >
        Notify Me
      </ShimmerAction>

      <PaymentModal open={open} onClose={close} title="Notify me">
        {status === "success" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <Ring />
            <p className="label mt-6 text-charcoal">We&rsquo;ll let you know</p>
            <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-charcoal">
              We&rsquo;ll email {email} the moment {productName} is back on
              the rail.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm leading-relaxed text-charcoal">
              {productName} is cut through. Leave your email and we&rsquo;ll
              tell you the moment it&rsquo;s back.
            </p>
            <label className="mt-6 block">
              <span className="label text-charcoal">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  "mt-2 h-12 w-full rounded-none border border-hairline bg-paper px-4 text-base text-ink",
                  "transition-colors duration-200 ease-state placeholder:text-charcoal",
                  "hover:border-purple-500 focus:border-purple-500",
                )}
              />
            </label>
            {status === "error" && error && (
              <p className="mt-3 text-sm text-purple-700">{error} — please try again.</p>
            )}
            <ShimmerAction
              type="submit"
              disabled={!emailValid || status === "submitting"}
              className="mt-6 w-full py-4"
            >
              {status === "submitting" ? "Sending…" : "Notify me"}
            </ShimmerAction>
          </form>
        )}
      </PaymentModal>
    </>
  );
}
