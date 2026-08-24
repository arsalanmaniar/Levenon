import "server-only";
import mysql from "mysql2/promise";

/**
 * MySQL connection pool for the Idraak catalogue database (`levenon_db`).
 *
 * The pool is cached on `globalThis` so Next's dev server does not open a new
 * one on every hot reload, and so a serverless instance reuses its pool across
 * invocations rather than exhausting `max_connections`.
 *
 * The app runs perfectly well with no database configured — see
 * `lib/server/catalogue-source.ts`, which falls back to the static catalogue.
 * Nothing here throws at import time.
 */

export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

/**
 * Parses `mysql://user:password@host:port/database`.
 *
 * Returns null for anything that is not a usable MySQL URL — including the
 * literal placeholder from .env.example — so a half-filled template can never
 * be mistaken for a live connection.
 */
export function parseDatabaseUrl(raw: string | undefined): DbConfig | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "mysql:") return null;

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const user = decodeURIComponent(url.username);
  if (!url.hostname || !user || !database) return null;

  // The template in .env.example is not a connection.
  if (user === "user" && url.hostname === "host") return null;

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user,
    password: decodeURIComponent(url.password),
    database,
  };
}

/**
 * Reads config from env. Returns null when the DB is not configured.
 *
 * `DATABASE_URL` is the primary form; the discrete `LEVENON_DB_*` variables
 * remain supported because they are what `npm run db:check` and existing
 * deployments already use.
 */
export function readDbConfig(): DbConfig | null {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  if (fromUrl) return fromUrl;

  const host = process.env.LEVENON_DB_HOST;
  const user = process.env.LEVENON_DB_USER;
  const database = process.env.LEVENON_DB_NAME;

  // Password may legitimately be empty on a local instance; host/user/name may not.
  if (!host || !user || !database) return null;

  return {
    host,
    port: Number(process.env.LEVENON_DB_PORT ?? 3306),
    user,
    password: process.env.LEVENON_DB_PASSWORD ?? "",
    database,
  };
}

export function isDatabaseConfigured(): boolean {
  return readDbConfig() !== null;
}

type GlobalWithPool = typeof globalThis & { __levenonPool?: mysql.Pool };

export function getPool(): mysql.Pool | null {
  const config = readDbConfig();
  if (!config) return null;

  const globalRef = globalThis as GlobalWithPool;
  if (globalRef.__levenonPool) return globalRef.__levenonPool;

  const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    // Deliberately small: this is a read-only storefront, and the ERP's MySQL
    // is shared with the dashboard backend. Do not starve it.
    connectionLimit: Number(process.env.LEVENON_DB_POOL ?? 5),
    connectTimeout: 10_000,
    // The dump stores prices as double/decimal. Returning decimals as strings
    // keeps them exact until *we* convert them to integer minor units; letting
    // the driver hand back JS floats is how rounding bugs get in.
    decimalNumbers: false,
    timezone: "Z",
    charset: "utf8mb4_unicode_ci",
    enableKeepAlive: true,
  });

  globalRef.__levenonPool = pool;
  return pool;
}

/** Typed query helper. Returns rows only; this layer never writes. */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  if (!pool) {
    throw new Error(
      "Database not configured — set LEVENON_DB_HOST/USER/NAME (see .env.example)",
    );
  }
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Connectivity + schema probe used by scripts/check-db.mjs and diagnostics. */
export async function pingDatabase(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const config = readDbConfig();
  if (!config) return { ok: false, detail: "not configured" };

  try {
    const rows = await query<{ version: string }>("SELECT VERSION() AS version");
    return { ok: true, detail: `connected to ${config.database} (${rows[0]?.version})` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
