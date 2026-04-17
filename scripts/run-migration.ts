import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const raw = readFileSync(resolve("drizzle/0000_initial_schema.sql"), "utf-8");

// Strip comment-only lines, then split on semicolons
const stripped = raw
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const statements = stripped
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

async function run() {
  console.log(`Running ${statements.length} statements...`);
  for (const stmt of statements) {
    const preview = stmt.substring(0, 60).replace(/\n/g, " ");
    console.log(`  → ${preview}...`);
    await sql.query(stmt);
  }
  console.log("Migration complete!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
