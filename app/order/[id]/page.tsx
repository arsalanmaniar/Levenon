import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { BankTransferDetails } from "@/components/cart/bank-transfer-details";
import { getOrderById } from "@/lib/orders/order-store";
import { formatMinor } from "@/lib/cart/types";
import { formatOrderDate } from "@/lib/orders/orders-data";

export const metadata: Metadata = {
  title: "Order confirmation",
  // Personal order data — never indexed, same as /track.
  robots: { index: false, follow: false },
};

/**
 * Order confirmation (client brief, 2026-08-25) — where `CheckoutModal`
 * sends a customer after `POST /api/orders` succeeds.
 *
 * Reads the store directly (Server Component), same reasoning as every other
 * data-layer read in this codebase: no reason for the app to HTTP-fetch its
 * own API. `GET /api/orders/[id]` exists for client-side and external
 * callers, not for this page.
 *
 * **Security note, disclosed rather than assumed away:** the id is a random
 * UUID, not a sequential order number, so this is an unguessable-capability
 * link rather than an enumerable one — the same minimal-security pattern
 * most checkout confirmation pages use. It is still a page that shows a
 * customer's name, phone, email and address to anyone holding the link;
 * `lib/orders/order-store.ts`'s interim, unauthenticated nature applies here
 * too.
 */
export default async function OrderConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <p className="label text-charcoal">Order {order.id}</p>
          <h1 className="mt-5 font-display text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Thank you, {order.customer.name.split(" ")[0]}.
          </h1>
          <p className="mt-6 max-w-measure text-body leading-relaxed text-charcoal">
            Placed {formatOrderDate(order.createdAt)}. Bookmark this page, or
            find it again any time from{" "}
            <Link
              href="/track"
              className="text-ink underline decoration-hairline underline-offset-4 hover:text-purple-500 hover:decoration-purple-500"
            >
              Track order
            </Link>{" "}
            with the number you ordered from.
          </p>

          <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="label text-charcoal">Status</h2>
              <OrderTimeline status={order.status} orderId={order.id} />
            </div>

            <div>
              <h2 className="label text-charcoal">Items</h2>
              <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
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

              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="label text-charcoal">Subtotal</span>
                  <span className="label text-charcoal">
                    {formatMinor(order.subtotalMinor, order.currency)}
                  </span>
                </div>
                {order.discount && (
                  <div className="flex items-baseline justify-between">
                    <span className="label text-success">{order.discount.code}</span>
                    <span className="label text-success">
                      −{formatMinor(order.discount.amountMinor, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-hairline pt-3">
                  <span className="label text-charcoal">Total</span>
                  <span className="font-display text-h3 font-extrabold tracking-[-0.02em]">
                    {formatMinor(order.totalMinor, order.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-8 border-t border-hairline pt-6">
                <h2 className="label text-charcoal">Delivering to</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  {order.customer.name}
                  <br />
                  {order.customer.address}, {order.customer.city}
                </p>
              </div>

              {order.paymentMethod === "bank_transfer" ? (
                <div className="mt-8 border-t border-hairline pt-6">
                  <h2 className="label text-charcoal">Bank transfer</h2>
                  <div className="mt-3">
                    <BankTransferDetails />
                  </div>
                </div>
              ) : (
                <div className="mt-8 border border-dashed border-hairline p-4">
                  <p className="text-body leading-relaxed text-charcoal">
                    Card payment is coming soon — this order is recorded and
                    marked <span className="text-ink">pending</span> while we
                    confirm payment with you directly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
