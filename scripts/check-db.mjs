#!/usr/bin/env node
/**
 * Verify the Idraak catalogue database before trusting the app against it.
 *
 *   npm run db:check
 *
 * Reads LEVENON_DB_* from .env.local (or the ambient environment), connects,
 * and reports what the storefront actually depends on: table presence, how many
 * products are publishable, how many have variants, how the three price columns
 * are populated, and which suppliers exist. Read-only — it issues SELECTs only.
 */
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

// Minimal .env.local loader — no dependency, and this script runs outside Next.
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
} catch {
  // No .env.local — fall back to the ambient environment.
}

/** Mirrors parseDatabaseUrl in lib/server/db/connection.ts. */
function fromDatabaseUrl(raw) {
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "mysql:") return null;
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const user = decodeURIComponent(url.username);
  if (!url.hostname || !user || !database) return null;
  if (user === "user" && url.hostname === "host") return null; // template
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user,
    password: decodeURIComponent(url.password),
    database,
  };
}

const config = fromDatabaseUrl(process.env.DATABASE_URL) ?? {
  host: process.env.LEVENON_DB_HOST,
  port: Number(process.env.LEVENON_DB_PORT ?? 3306),
  user: process.env.LEVENON_DB_USER,
  password: process.env.LEVENON_DB_PASSWORD ?? "",
  database: process.env.LEVENON_DB_NAME,
};

if (!config.host || !config.user || !config.database) {
  console.error("Not configured.");
  console.error("");
  console.error("Set DATABASE_URL in .env.local:");
  console.error("  DATABASE_URL=mysql://user:password@host:3306/levenon_db");
  console.error("");
  console.error("(or the discrete LEVENON_DB_HOST / _USER / _NAME vars).");
  console.error("A literal user@host template is treated as unset — see .env.example.");
  process.exit(1);
}

const REQUIRED_TABLES = [
  "products",
  "product_variations",
  "product_variation_attributes",
  "product_attributes",
  "categories",
  "media",
];

let connection;
try {
  connection = await mysql.createConnection({ ...config, connectTimeout: 10_000 });
} catch (error) {
  // A stack trace helps nobody here; the cause and the fix do.
  console.error(`Could not connect to ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.error(`  ${error.code ?? "ERROR"}: ${error.message}`);
  if (error.code === "ECONNREFUSED") {
    console.error("  Nothing is listening — is the MySQL server running and the port right?");
  } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("  Credentials rejected — check the user and password in DATABASE_URL.");
  } else if (error.code === "ER_BAD_DB_ERROR") {
    console.error("  Server reached, database missing — check the name after the last '/'.");
  }
  process.exit(3);
}
const q = async (sql, params = []) => (await connection.query(sql, params))[0];

try {
  const [{ version }] = await q("SELECT VERSION() AS version");
  console.log(`connected: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log(`server:    ${version}\n`);

  console.log("— required tables —");
  const tables = (await q("SHOW TABLES")).map((row) => Object.values(row)[0]);
  let missing = 0;
  for (const table of REQUIRED_TABLES) {
    const present = tables.includes(table);
    if (!present) missing += 1;
    console.log(`  ${present ? "ok     " : "MISSING"} ${table}`);
  }
  if (missing) {
    console.error(`\n${missing} required table(s) missing — the adapter will fail.`);
    process.exit(2);
  }

  console.log("\n— products by status —");
  for (const row of await q(
    `SELECT status, COUNT(*) AS n, SUM(deleted_at IS NOT NULL) AS soft_deleted
       FROM products GROUP BY status ORDER BY n DESC`,
  )) {
    console.log(`  ${String(row.status).padEnd(26)} ${String(row.n).padStart(6)}  (soft-deleted ${row.soft_deleted})`);
  }

  console.log("\n— what the storefront depends on —");
  const [coverage] = await q(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE status='ACTIVE' AND deleted_at IS NULL) AS publishable,
      (SELECT COUNT(DISTINCT product_id) FROM product_variations) AS with_variants,
      (SELECT COUNT(*) FROM products WHERE category_id IS NULL) AS null_category,
      (SELECT COUNT(*) FROM products WHERE sale_price IS NOT NULL) AS has_sale_price,
      (SELECT COUNT(*) FROM products WHERE recommended_price > 0) AS has_recommended,
      (SELECT COUNT(*) FROM products WHERE base_price > 0) AS has_base
  `);
  for (const [key, value] of Object.entries(coverage)) {
    console.log(`  ${key.padEnd(18)} ${value}`);
  }

  console.log("\n— price sanity (rows whose chosen price would be 0) —");
  const [{ zero }] = await q(`
    SELECT COUNT(*) AS zero FROM products
     WHERE status='ACTIVE' AND deleted_at IS NULL
       AND COALESCE(NULLIF(sale_price,0), NULLIF(recommended_price,0), NULLIF(base_price,0)) IS NULL
  `);
  console.log(`  ${zero} product(s) would map to priceMinor = 0`);

  console.log("\n— suppliers (subset filter candidates) —");
  for (const row of await q(`
    SELECT s.id, s.name, COUNT(p.id) AS products
      FROM suppliers s LEFT JOIN products p
        ON p.supplier_id = s.id AND p.status='ACTIVE' AND p.deleted_at IS NULL
     GROUP BY s.id, s.name HAVING products > 0
     ORDER BY products DESC LIMIT 20
  `)) {
    console.log(`  id=${String(row.id).padEnd(5)} ${String(row.products).padStart(5)}  ${row.name}`);
  }

  const filter = [
    ["LEVENON_SUPPLIER_IDS", process.env.LEVENON_SUPPLIER_IDS],
    ["LEVENON_CATEGORY_IDS", process.env.LEVENON_CATEGORY_IDS],
    ["LEVENON_SKU_ALLOWLIST", process.env.LEVENON_SKU_ALLOWLIST],
  ].filter(([, value]) => value);

  console.log("\n— subset filter —");
  if (filter.length === 0) {
    console.log("  none configured → the app stays on the static catalogue.");
    console.log("  Set one of LEVENON_SUPPLIER_IDS / LEVENON_CATEGORY_IDS / LEVENON_SKU_ALLOWLIST");
    console.log("  to publish from the database.");
  } else {
    for (const [key, value] of filter) console.log(`  ${key}=${value}`);
  }
} finally {
  await connection.end();
}
