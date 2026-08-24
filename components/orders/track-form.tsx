"use client";

import { useId, useState } from "react";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ORDER_TRACKING_MESSAGE, shopWhatsAppUrl } from "@/lib/whatsapp";
import { formatMinor } from "@/lib/cart/types";
import {
  formatOrderDate,
  isPakistaniMobile,
  lookupOrders,
} from "@/lib/orders/orders-data";
import type { Order } from "@/lib/orders/orders-data";
import { cn } from "@/lib/cn";

/*
 * Two failures, two sentences, each naming what to do next. The malformed line
 * shows both accepted forms rather than describing them.
 */
const EMPTY_MESSAGE = "Enter the number you ordered from";
const MALFORMED_MESSAGE = "Pakistani mobiles only — 03XX XXXXXXX or +92 3XX XXXXXXX";
/*
 * The idle hint carries the accepted formats, not another restatement of what
 * the field is for. The heading, the intro sentence and the label already said
 * that three times over; a fourth telling is noise, and the format is the one
 * thing a reader cannot guess.
 */
const HINT_MESSAGE = "03XX XXXXXXX or +92 3XX XXXXXXX";

// The tracking opener lives in `lib/whatsapp.ts` with every other pre-filled
// message, so the shop's voice stays consistent across entry points.

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

/**
 * Nothing came back.
 *
 * The copy does not say the order does not exist, because that is not what we
 * know — the lookup is a stub and no real order table has been asked. It says
 * we cannot trace it here yet and hands the reader to a human on WhatsApp.
 */
function NoOrders() {
  const href = shopWhatsAppUrl(ORDER_TRACKING_MESSAGE);

  return (
    <div className="mt-12 border border-hairline px-6 py-12 text-center md:px-10 md:py-16">
      <div className="flex justify-center">
        <Ring />
      </div>

      <p className="label mt-8 text-charcoal">Nothing to show</p>
      <h2 className="mx-auto mt-4 max-w-[24ch] font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">
        We cannot trace this number here yet
      </h2>
      <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-charcoal">
        Tracking is not connected to the shop&rsquo;s order book, so an order
        placed from this number will not appear on this page. That is a gap on
        our side, not a missing order. Send the number on WhatsApp and it gets
        traced by hand.
      </p>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="label mt-8 inline-flex min-h-[48px] items-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          Ask on WhatsApp
          <span className="sr-only">— opens WhatsApp in a new tab</span>
        </a>
      ) : (
        <p className="mx-auto mt-8 max-w-[46ch] text-sm leading-relaxed text-charcoal">
          No shop WhatsApp number is configured, so there is no link to give
          you. Set{" "}
          <code className="font-mono text-ink">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
          to a full international number and rebuild.
        </p>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <li className="border border-hairline p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="font-display text-xl font-extrabold tracking-[-0.02em]">
          {order.id}
        </h3>
        <p className="label text-charcoal">
          Placed {formatOrderDate(order.placedAt)}
        </p>
      </div>

      <p className="label mt-3 text-purple-500">Status — {order.status}</p>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
        <OrderTimeline status={order.status} orderId={order.id} className="mt-0" />

        <div>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {order.lines.map((line) => (
              <li
                key={`${order.id}-${line.name}`}
                className="flex items-baseline justify-between gap-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-ink">{line.name}</p>
                  <p className="label mt-2 text-charcoal">
                    {line.size} · {line.quantity} ×{" "}
                    {formatMinor(line.unitPriceMinor, order.currency)}
                  </p>
                </div>
                <span className="label whitespace-nowrap text-ink">
                  {formatMinor(line.unitPriceMinor * line.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-baseline justify-between gap-6">
            <span className="label text-charcoal">Total</span>
            <span className="font-display text-xl font-extrabold tracking-[-0.02em]">
              {formatMinor(order.totalMinor, order.currency)}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The tracking form and its results.
 *
 * One field, because one field is all the lookup takes today. Submission is
 * synchronous against the stub in `lib/orders/orders-data.ts`; when that
 * becomes a server call, only the handler below changes.
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
  const [results, setResults] = useState<Order[] | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = value.trim();

    if (phone.length === 0) {
      setError(EMPTY_MESSAGE);
      setResults(null);
      return;
    }

    if (!isPakistaniMobile(phone)) {
      // Say what is wrong with the number *and* show the way out, rather than
      // leaving the reader at a rejected field with nowhere to go.
      setError(MALFORMED_MESSAGE);
      setResults([]);
      return;
    }

    setError(null);
    setResults(lookupOrders(phone));
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
          WhatsApp number
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
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
            onChange={(event) => {
              setValue(event.target.value);
              // An error about what was typed a moment ago is noise once the
              // reader is already fixing it.
              if (error !== null) setError(null);
            }}
            className={cn(
              "h-12 w-full min-w-0 flex-1 rounded-none border bg-paper px-4 text-base text-ink",
              "transition-colors duration-200 ease-state placeholder:text-charcoal",
              "hover:border-purple-500 focus:border-purple-500",
              error !== null ? "border-purple-700" : "border-hairline",
            )}
          />

          <ShimmerAction type="submit" className="shrink-0">
            Find my orders
          </ShimmerAction>
        </div>

        <p
          id={statusId}
          role="status"
          className={cn("label mt-4", error !== null ? "text-purple-700" : "text-charcoal")}
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
