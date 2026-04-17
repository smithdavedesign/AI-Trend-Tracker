/**
 * One-time script: populate npm_package on tools that have published npm packages.
 * Run with: npx tsx scripts/set-npm-packages.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { tools } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const NPM_PACKAGES: Record<string, string> = {
  // Agents
  "langchain":          "langchain",
  "langgraph":          "@langchain/langgraph",
  "n8n":                "n8n",
  "flowise":            "flowise",
  // Infra
  "ollama":             "ollama",
  "huggingface":        "@huggingface/inference",
  "together-ai":        "together-ai",
  "groq":               "groq-sdk",
  "replicate":          "replicate",
  "chromadb":           "chromadb",
  // Vertical
  "elevenlabs":         "elevenlabs",
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const db = drizzle(neon(process.env.DATABASE_URL));

  for (const [toolId, pkg] of Object.entries(NPM_PACKAGES)) {
    await db.update(tools).set({ npmPackage: pkg }).where(eq(tools.id, toolId));
    console.log(`  ✓ ${toolId} → ${pkg}`);
  }

  console.log(`\nDone — ${Object.keys(NPM_PACKAGES).length} tools updated`);
}

main().catch((e) => { console.error(e); process.exit(1); });
