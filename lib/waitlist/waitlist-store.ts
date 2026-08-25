import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Back-in-stock waitlist — file-based, same interim pattern as
 * `lib/orders/order-store.ts` (client brief, 2026-08-26: "saves to
 * /data/waitlist.json (same pattern as orders)"). Same known limitation as
 * that file applies here too: this will not durably persist on a typical
 * serverless deployment's read-only filesystem outside `/tmp` — see that
 * file's doc comment for the full explanation, not repeated here.
 */

export type WaitlistEntry = {
  id: string;
  createdAt: string;
  email: string;
  productId: string;
  productName: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

async function readAll(): Promise<WaitlistEntry[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WaitlistEntry[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(entries: WaitlistEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

// Serialises writes within this process — see order-store.ts for why.
let writeQueue: Promise<unknown> = Promise.resolve();

export async function addWaitlistEntry(input: {
  email: string;
  productId: string;
  productName: string;
}): Promise<WaitlistEntry> {
  const entry: WaitlistEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const task = writeQueue.then(async () => {
    const entries = await readAll();
    entries.push(entry);
    await writeAll(entries);
  });
  writeQueue = task.catch(() => undefined);
  await task;

  return entry;
}
