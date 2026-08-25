import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateOrderInput, StoredOrder } from "./order-types";

export type {
  OrderStatus,
  OrderCustomer,
  OrderDiscount,
  PaymentMethod,
  StoredOrder,
  CreateOrderInput,
} from "./order-types";
export { ORDER_STATUS_SEQUENCE, orderStatusIndex } from "./order-types";

/**
 * The order data store — file-based, interim (client brief, 2026-08-25).
 *
 * Types live in `./order-types` (no `server-only`, so client components can
 * import the status vocabulary) and are re-exported here for convenience —
 * every server-side caller can still import everything from this one file.
 *
 * The brief's own words: "Since no external DB credentials yet, use the
 * existing Neon/Postgres pattern OR build a Next.js API route that stores
 * orders in a JSON file... as an interim solution until real DB is
 * connected." No Neon/Postgres setup exists for orders (the one database
 * connection in this codebase, `lib/server/db/`, is the read-only Idraak
 * MySQL *catalogue*, a different system for a different purpose), so this
 * takes the JSON-file path.
 *
 * **Known limitation, stated rather than hidden — read before deploying:**
 * a typical serverless host (Vercel and similar) gives a Next.js app a
 * read-only filesystem at runtime except `/tmp`, which is wiped between
 * invocations. Writing to `data/orders.json` under `process.cwd()` works
 * for local development and for a persistent-disk deployment (a VM, a
 * container with a mounted volume), but on serverless hosting an order
 * written by one request may not be readable by the next, and will not
 * survive a redeploy. This is exactly the gap the brief calls "interim until
 * real DB is connected" — moving `readAll`/`writeAll` below onto a real
 * database is a contained, one-file change, since every caller only ever
 * goes through `createOrder`/`getOrderById`/`getOrdersByPhone`.
 *
 * Concurrency: writes are serialised through `writeQueue` below, which
 * covers concurrent requests handled by one Node process (the common case
 * for local dev and for a single persistent server instance). It does not
 * cover multiple serverless instances writing at once — another reason this
 * is explicitly an interim measure, not a production order system.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

async function readAll(): Promise<StoredOrder[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(orders: StoredOrder[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(orders, null, 2), "utf8");
}

// Serialises writes within this process — see the file-level comment.
let writeQueue: Promise<unknown> = Promise.resolve();

export async function createOrder(input: CreateOrderInput): Promise<StoredOrder> {
  const order: StoredOrder = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    ...input,
  };

  const task = writeQueue.then(async () => {
    const orders = await readAll();
    orders.push(order);
    await writeAll(orders);
  });
  // Swallow so one failed write doesn't wedge the queue for every request
  // after it; the failure itself still propagates to this call's own caller
  // via the `await task` below.
  writeQueue = task.catch(() => undefined);
  await task;

  return order;
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const orders = await readAll();
  return orders.find((order) => order.id === id) ?? null;
}

/** Newest first — the order a customer placed most recently is what they came to check. */
export async function getOrdersByPhone(phone: string): Promise<StoredOrder[]> {
  const orders = await readAll();
  return orders
    .filter((order) => order.customer.phone === phone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
