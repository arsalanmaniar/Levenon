import type { CartLine } from "@/lib/cart/types";
import type { Currency } from "@/lib/types";

/**
 * Order shapes and status vocabulary — split out of `order-store.ts`
 * (client brief, 2026-08-25) because that file starts with `import
 * "server-only"` for its filesystem calls, and Next refuses to let a client
 * component import *anything* from a server-only module, types included.
 * `OrderTimeline` needs `OrderStatus`/`ORDER_STATUS_SEQUENCE` and is a client
 * component (it animates), so those live here instead, with no server-only
 * code anywhere in this file's import graph.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "dispatched"
  | "delivered";

export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "dispatched",
  "delivered",
];

export function orderStatusIndex(status: OrderStatus): number {
  return ORDER_STATUS_SEQUENCE.indexOf(status);
}

export type OrderCustomer = {
  name: string;
  /** Canonical 12-digit Pakistani mobile, `923XXXXXXXXX` — see `toPakistaniMobile`. */
  phone: string;
  email: string;
  address: string;
  city: string;
};

export type OrderDiscount = {
  code: string;
  /** Integer minor units. */
  amountMinor: number;
};

export type PaymentMethod = "card" | "bank_transfer";

export type StoredOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: CartLine[];
  /**
   * Integer minor units — `subtotalMinor`/`totalMinor`, not the brief's bare
   * `subtotal`/`total`, to match this codebase's one binding convention for
   * money (see `lib/cart/types.ts`, `formatMinor`): a name without "Minor"
   * reads as major units and has caused real bugs elsewhere in this project
   * when it wasn't followed.
   */
  subtotalMinor: number;
  discount: OrderDiscount | null;
  totalMinor: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
};

export type CreateOrderInput = {
  customer: OrderCustomer;
  items: CartLine[];
  subtotalMinor: number;
  discount: OrderDiscount | null;
  totalMinor: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
};
