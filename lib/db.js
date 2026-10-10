import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

export function newId() {
  return randomUUID();
}

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "postgresql://postgres:postgres@127.0.0.1:5432/bid_ethiopia");
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const globalForDb = globalThis;

async function initBackend() {
  const url = getDatabaseUrl();
  try {
    const pool = new Pool({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 2500,
    });
    await pool.query("SELECT 1");
    await pool.query("ALTER TABLE users DROP COLUMN IF EXISTS licence_number");
    return { type: "pg", pool };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = "./data/pglite";
    fs.mkdirSync(dir, { recursive: true });
    const pglite = await PGlite.create(dir);
    const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
    await pglite.exec(fs.readFileSync(schemaPath, "utf8"));
    console.warn(
      `PostgreSQL is not running (${error.code || error.message}). Using local PGlite at ${dir}`,
    );
    return { type: "pglite", pglite };
  }
}

export async function connectDB() {
  if (!globalForDb.bidDb) {
    globalForDb.bidDb = initBackend();
  }
  return globalForDb.bidDb;
}

export async function query(text, params = []) {
  const backend = await connectDB();
  if (backend.type === "pg") {
    const result = await backend.pool.query(text, params);
    return result.rows;
  }
  const result = await backend.pglite.query(text, params);
  return result.rows;
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}
