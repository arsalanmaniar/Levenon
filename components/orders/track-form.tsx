"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { m, useAnimationControls } from "framer-motion";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatMinor } from "@/lib/cart/types";
import type { StoredOrder } from "@/lib/orders/order-types";
import { formatOrderDate, isPakistaniMobile } from "@/lib/orders/orders-data";
import { cn } from "@/lib/cn";

/*
 * Two failures, two sentences, each naming what to do next. The malformed line
 * shows both accepted forms rather than describing them.
 */
const EMPTY_MESSAGE = "Enter the number you ordered from";
const MALFORMED_MESSAGE = "Pakistani mobiles only — 03XX XXXXXXX or +92 3XX XXXXXXX";
const ERROR_MESSAGE = "Couldn't reach the order book — try again in a moment";
/*
 * The idle hint carries the accepted formats, not another restatement of what
 * the field is for. The heading, the intro sentence and the label already said
 * that three times over; a fourth telling is noise, and the format is the one
 * thing a reader cannot guess.
 */
const HINT_MESSAGE = "03XX XXXXXXX or +92 3XX XXXXXXX";

/** The ring from the wordmark's "e" — same construction as the empty bag. */
function Ring() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="h-20 w-20 text-purple-500"
    >
      <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
      <circle
        cx="60"
        cy="60"
        r="26"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="5 7"
      />
    </svg>
  );
}

/** Nothing came back for this number. */
function NoOrders() {
  return (
    <div className="mt-12 border border-hairline px-6 py-12 text-center md:px-12 lg:px-20 md:py-16">
      <div className="flex justify-center">
        <Ring />
      </div>

      <p className="label mt-8 text-charcoal">Nothing to show</p>
      <h2 className="mx-auto mt-4 max-w-[24ch] font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">
        No orders on this number yet
      </h2>
      <p className="mx-auto mt-4 max-w-[46ch] text-body leading-relaxed text-charcoal">
        Every order placed at checkout is findable here the moment it&rsquo;s
        placed — if you&rsquo;ve just ordered, the confirmation page you
        landed on also has this number on it.
      </p>

      <Link
        href="/shop"
        className="label mt-8 inline-flex min-h-[48px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
      >
        Shop Collection
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: StoredOrder }) {
  return (
    <li className="border border-hairline p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="font-display text-h3 font-extrabold tracking-[-0.02em]">
          <Link href={`/order/${order.id}`} className="hover:text-purple-500">
            Order {order.id.slice(0, 8)}
          </Link>
        </h3>
        <p className="label text-charcoal">Placed {formatOrderDate(order.createdAt)}</p>
      </div>

      <p className="label mt-3 text-purple-500">
        Status — {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </p>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
        <OrderTimeline status={order.status} orderId={order.id} className="mt-0" />

        <div>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {order.items.map((item) => (
              <li
                key={item.variantSku}
                className="flex items-baseline justify-between gap-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-ink">{item.name}</p>
                  <p className="label mt-2 text-charcoal">
                    {item.size} · {item.quantity} ×{" "}
                    {formatMinor(item.unitPriceMinor, order.currency)}
                  </p>
                </div>
                <span className="label whitespace-nowrap text-ink">
                  {formatMinor(item.unitPriceMinor * item.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-baseline justify-between gap-6">
            <span className="label text-charcoal">Total</span>
            <span className="font-display text-h3 font-extrabold tracking-[-0.02em]">
              {formatMinor(order.totalMinor, order.currency)}
            </span>
          </div>

          <Link
            href={`/order/${order.id}`}
            className="label mt-6 inline-flex min-h-[44px] items-center text-ink transition-colors duration-200 ease-state hover:text-purple-500"
          >
            View full order →
          </Link>
        </div>
      </div>
    </li>
  );
}

/**
 * The tracking form and its results.
 *
 * One field, because one field is all the lookup takes. Submission fetches
 * `GET /api/orders?phone=` (client brief, 2026-08-25) — the fixture stub this
 * used to call against was retired the same pass; see
 * `lib/orders/order-store.ts` for what backs the real lookup now.
 *
 * The line under the field is the single status channel — hint, validation
 * error and result count all land there, it is always in the DOM, and it is
 * always the field's description, so `aria-describedby` never points at
 * nothing.
 */
export function TrackForm() {
  const id = useId().replace(/:/g, "");
  const inputId = `track-phone-${id}`;
  const statusId = `track-status-${id}`;

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StoredOrder[] | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const shakeControls = useAnimationControls();

  function shake() {
    if (reducedMotion) return;
    shakeControls.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = value.trim();

    if (phone.length === 0) {
      setError(EMPTY_MESSAGE);
      setResults(null);
      shake();
      return;
    }

    if (!isPakistaniMobile(phone)) {
      // Say what is wrong with the number *and* show the way out, rather than
      // leaving the reader at a rejected field with nowhere to go.
      setError(MALFORMED_MESSAGE);
      setResults([]);
      shake();
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}`);
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { orders: StoredOrder[] };
      setResults(data.orders);
    } catch {
      setError(ERROR_MESSAGE);
      setResults(null);
      shake();
    } finally {
      setLoading(false);
    }
  }

  const summary =
    results === null
      ? null
      : results.length === 1
        ? "1 order on this number"
        : `${results.length} orders on this number`;

  return (
    <div className="mt-12">
      <form noValidate onSubmit={handleSubmit} className="max-w-[34rem]">
        <label htmlFor={inputId} className="label block text-charcoal">
          Phone number
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <m.input
            id={inputId}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            maxLength={20}
            placeholder="03XX XXXXXXX"
            value={value}
            aria-invalid={error !== null}
            aria-describedby={statusId}
            animate={shakeControls}
            onChange={(event) => {
              setValue(event.target.value);
              // An error about what was typed a moment ago is noise once the
              // reader is already fixing it.
              if (error !== null) setError(null);
            }}
            className={cn(
              "min-h-[48px] w-full min-w-0 flex-1 rounded-sm border bg-paper px-4 text-base text-ink",
              "transition-[border-color] duration-200 ease-state placeholder:text-charcoal/50",
              "hover:border-purple-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
              error !== null ? "border-error" : "border-hairline",
            )}
          />

          <ShimmerAction type="submit" disabled={loading} className="shrink-0">
            {loading ? "Searching…" : "Find my orders"}
          </ShimmerAction>
        </div>

        <p
          id={statusId}
          role="status"
          className={cn("label mt-4", error !== null ? "text-error" : "text-charcoal")}
        >
          {error ?? (results && results.length > 0 ? summary : HINT_MESSAGE)}
        </p>
      </form>

      {results !== null &&
        (results.length === 0 ? (
          <NoOrders />
        ) : (
          <section className="mt-16">
            <h2 className="label text-charcoal">Your orders</h2>
            <ol className="mt-6 space-y-6">
              {results.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ol>
          </section>
        ))}
    </div>
  );
}
