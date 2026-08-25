"use client";

import { useState } from "react";
import Link from "next/link";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { FormField } from "@/components/ui/form-field";
import { BankTransferDetails } from "./bank-transfer-details";
import { formatMinor, type CartLine } from "@/lib/cart/types";
import type { OrderSummary } from "@/lib/cart/discount";
import { isPakistaniMobile } from "@/lib/orders/orders-data";

type PaymentMethod = "card" | "bank_transfer";
type Step = "form" | "submitting" | "success" | "error";

type Fields = { name: string; phone: string; email: string; address: string; city: string };
const EMPTY_FIELDS: Fields = { name: "", phone: "", email: "", address: "", city: "" };

/**
 * The checkout form (client brief, 2026-08-25) — replaces the WhatsApp
 * checkout entirely. Opened from the cart drawer by either payment button;
 * `paymentMethod` decides only what the success step shows (bank details vs.
 * a "card coming soon" note) and which value is sent to `POST /api/orders`.
 *
 * Kept as one component with an internal `step` rather than a route, so the
 * cart's own `lines`/`summary` never have to be re-fetched or threaded
 * through a navigation — everything the order needs is already in memory
 * from the drawer that opened this.
 */
export function CheckoutModal({
  paymentMethod,
  lines,
  summary,
  onOrderPlaced,
}: {
  paymentMethod: PaymentMethod;
  lines: CartLine[];
  summary: OrderSummary;
  /** Called once an order is successfully created — the drawer clears the cart. */
  onOrderPlaced: () => void;
}) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    totalMinor: number;
    currency: "PKR" | "USD";
  } | null>(null);
  // Both start closed: no field shows red on a form nobody has tried to
  // submit yet. `shakeSignal` is a counter, not the same boolean as
  // `attempted` — a second failed attempt with nothing changed still needs
  // to shake again, which a boolean flip can't express.
  const [attempted, setAttempted] = useState(false);
  const [shakeSignal, setShakeSignal] = useState(0);

  const phoneValid = isPakistaniMobile(fields.phone);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);
  const nameValid = fields.name.trim().length > 0;
  const addressValid = fields.address.trim().length > 0;
  const cityValid = fields.city.trim().length > 0;
  const canSubmit = nameValid && phoneValid && emailValid && addressValid && cityValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !summary.currency) {
      setAttempted(true);
      setShakeSignal((n) => n + 1);
      return;
    }

    setStep("submitting");
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: fields,
          items: lines,
          subtotalMinor: summary.subtotalMinor,
          discount: summary.discount
            ? { code: summary.discount.code, amountMinor: summary.discountMinor }
            : null,
          totalMinor: summary.totalMinor,
          currency: summary.currency,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed (${response.status})`);
      }

      const { order } = (await response.json()) as {
        order: { id: string; totalMinor: number; currency: "PKR" | "USD" };
      };
      // Snapshotted from the response, not read live off `summary` — the
      // parent clears the cart on `onOrderPlaced` below, which would
      // otherwise zero out `summary.totalMinor`/`currency` while this success
      // view is still showing.
      setConfirmed({ totalMinor: order.totalMinor, currency: order.currency });
      setOrderId(order.id);
      setStep("success");
      onOrderPlaced();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      setStep("error");
    }
  }

  if (step === "success" && orderId && confirmed) {
    return (
      <div>
        <p className="text-body leading-relaxed text-charcoal">
          Order placed — {formatMinor(confirmed.totalMinor, confirmed.currency)}. A
          confirmation is waiting at the link below.
        </p>

        {paymentMethod === "bank_transfer" ? (
          <div className="mt-6">
            <BankTransferDetails />
          </div>
        ) : (
          <p className="mt-6 border border-dashed border-hairline p-4 text-body leading-relaxed text-charcoal">
            Card payment is coming soon. Your order is recorded and marked{" "}
            <span className="text-ink">pending</span> — we will be in touch to
            confirm payment.
          </p>
        )}

        <Link
          href={`/order/${orderId}`}
          className="label mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          View order
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Full name"
        value={fields.name}
        onChange={(event) =>
          setFields((prev) => ({ ...prev, name: event.target.value }))
        }
        autoComplete="name"
        required
        error={attempted && !nameValid ? "Enter your full name" : null}
        shakeSignal={shakeSignal}
      />
      <FormField
        label="Phone"
        value={fields.phone}
        onChange={(event) =>
          setFields((prev) => ({ ...prev, phone: event.target.value }))
        }
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="03XX XXXXXXX"
        required
        error={
          attempted && !phoneValid
            ? "Pakistani mobiles only — 03XX XXXXXXX or +92 3XX XXXXXXX"
            : null
        }
        shakeSignal={shakeSignal}
      />
      <FormField
        label="Email"
        value={fields.email}
        onChange={(event) =>
          setFields((prev) => ({ ...prev, email: event.target.value }))
        }
        type="email"
        autoComplete="email"
        required
        error={attempted && !emailValid ? "Enter a valid email address" : null}
        shakeSignal={shakeSignal}
      />
      <FormField
        label="Delivery address"
        value={fields.address}
        onChange={(event) =>
          setFields((prev) => ({ ...prev, address: event.target.value }))
        }
        autoComplete="street-address"
        required
        error={attempted && !addressValid ? "Enter a delivery address" : null}
        shakeSignal={shakeSignal}
      />
      <FormField
        label="City"
        value={fields.city}
        onChange={(event) =>
          setFields((prev) => ({ ...prev, city: event.target.value }))
        }
        autoComplete="address-level2"
        required
        error={attempted && !cityValid ? "Enter a city" : null}
        shakeSignal={shakeSignal}
      />

      {summary.currency && (
        <div className="flex items-baseline justify-between border-t border-hairline pt-4">
          <span className="label text-charcoal">Total</span>
          <span className="font-display text-lg font-extrabold tracking-[-0.02em]">
            {formatMinor(summary.totalMinor, summary.currency)}
          </span>
        </div>
      )}

      {step === "error" && error && (
        <p className="text-sm text-error">{error} — please try again.</p>
      )}

      <ShimmerAction
        type="submit"
        disabled={!canSubmit || step === "submitting"}
        className="w-full py-4"
      >
        {step === "submitting"
          ? "Placing order…"
          : paymentMethod === "card"
            ? "Continue to pay by card"
            : "Continue with bank transfer"}
      </ShimmerAction>
    </form>
  );
}
