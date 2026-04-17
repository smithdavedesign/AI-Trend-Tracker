import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { tools as toolsTable } from "../src/lib/db/schema";

/**
 * Seed script — run with: npx tsx scripts/seed-tools.ts
 * Requires DATABASE_URL in env.
 */

const toolsSeed = [
  // ─── LLM ───────────────────────────────────────────────
  { id: "chatgpt", name: "ChatGPT", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://chat.openai.com" },
  { id: "claude", name: "Claude", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://claude.ai" },
  { id: "gemini", name: "Gemini", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://gemini.google.com" },
  { id: "llama", name: "LLaMA", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/meta-llama/llama", websiteUrl: "https://llama.meta.com" },
  { id: "mistral", name: "Mistral", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/mistralai/mistral-src", websiteUrl: "https://mistral.ai" },
  { id: "grok", name: "Grok", category: "llm" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://grok.x.ai" },
  { id: "command-r", name: "Command R+", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://cohere.com" },
  { id: "phi", name: "Phi", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/phi-3", websiteUrl: "https://azure.microsoft.com/en-us/products/phi" },
  { id: "qwen", name: "Qwen", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/QwenLM/Qwen2", websiteUrl: "https://qwenlm.github.io" },
  { id: "deepseek", name: "DeepSeek", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/deepseek-ai/DeepSeek-V2", websiteUrl: "https://deepseek.com" },

  // ─── Coding ────────────────────────────────────────────
  { id: "github-copilot", name: "GitHub Copilot", category: "coding" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://github.com/features/copilot" },
  { id: "cursor", name: "Cursor", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://cursor.com" },
  { id: "windsurf", name: "Windsurf", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://codeium.com/windsurf" },
  { id: "aider", name: "Aider", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/paul-gauthier/aider", websiteUrl: "https://aider.chat" },
  { id: "continue", name: "Continue", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/continuedev/continue", websiteUrl: "https://continue.dev" },
  { id: "tabnine", name: "Tabnine", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: null, websiteUrl: "https://tabnine.com" },
  { id: "supermaven", name: "Supermaven", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://supermaven.com" },
  { id: "v0", name: "v0", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://v0.dev" },
  { id: "bolt", name: "Bolt.new", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://bolt.new" },
  { id: "replit-agent", name: "Replit Agent", category: "coding" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://replit.com" },

  // ─── Agents ────────────────────────────────────────────
  { id: "autogpt", name: "AutoGPT", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/Significant-Gravitas/AutoGPT", websiteUrl: "https://agpt.co" },
  { id: "crewai", name: "CrewAI", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/crewAIInc/crewAI", websiteUrl: "https://crewai.com" },
  { id: "langchain", name: "LangChain", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/langchain-ai/langchain", websiteUrl: "https://langchain.com", npmPackage: "langchain" },
  { id: "langgraph", name: "LangGraph", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/langchain-ai/langgraph", websiteUrl: "https://langchain.com/langgraph", npmPackage: "@langchain/langgraph" },
  { id: "openai-agents-sdk", name: "OpenAI Agents SDK", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/openai/openai-agents-python", websiteUrl: "https://openai.com" },
  { id: "autogen", name: "AutoGen", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/autogen", websiteUrl: "https://microsoft.github.io/autogen" },
  { id: "dify", name: "Dify", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/langgenius/dify", websiteUrl: "https://dify.ai" },
  { id: "n8n", name: "n8n", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/n8n-io/n8n", websiteUrl: "https://n8n.io", npmPackage: "n8n" },
  { id: "flowise", name: "Flowise", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/FlowiseAI/Flowise", websiteUrl: "https://flowiseai.com", npmPackage: "flowise" },
  { id: "semantic-kernel", name: "Semantic Kernel", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/semantic-kernel", websiteUrl: "https://learn.microsoft.com/semantic-kernel" },

  // ─── Infrastructure ────────────────────────────────────
  { id: "ollama", name: "Ollama", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/ollama/ollama", websiteUrl: "https://ollama.com", npmPackage: "ollama" },
  { id: "vllm", name: "vLLM", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/vllm-project/vllm", websiteUrl: "https://vllm.ai" },
  { id: "llamacpp", name: "llama.cpp", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/ggerganov/llama.cpp", websiteUrl: null },
  { id: "lmstudio", name: "LM Studio", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: null, websiteUrl: "https://lmstudio.ai" },
  { id: "huggingface", name: "Hugging Face", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/huggingface/transformers", websiteUrl: "https://huggingface.co", npmPackage: "@huggingface/inference" },
  { id: "openrouter", name: "OpenRouter", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://openrouter.ai" },
  { id: "together-ai", name: "Together AI", category: "infra" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://together.ai", npmPackage: "together-ai" },
  { id: "groq", name: "Groq", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://groq.com", npmPackage: "groq-sdk" },
  { id: "replicate", name: "Replicate", category: "infra" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://replicate.com", npmPackage: "replicate" },
  { id: "chromadb", name: "ChromaDB", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/chroma-core/chroma", websiteUrl: "https://trychroma.com", npmPackage: "chromadb" },

  // ─── Vertical / Domain-specific ────────────────────────
  { id: "perplexity", name: "Perplexity", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://perplexity.ai" },
  { id: "midjourney", name: "Midjourney", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://midjourney.com" },
  { id: "stable-diffusion", name: "Stable Diffusion", category: "vertical" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/Stability-AI/stablediffusion", websiteUrl: "https://stability.ai" },
  { id: "elevenlabs", name: "ElevenLabs", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://elevenlabs.io", npmPackage: "elevenlabs" },
  { id: "runway", name: "Runway", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://runwayml.com" },
  { id: "suno", name: "Suno", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://suno.com" },
  { id: "jasper", name: "Jasper", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://jasper.ai" },
  { id: "notion-ai", name: "Notion AI", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://notion.so" },
  { id: "otter-ai", name: "Otter.ai", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://otter.ai" },
  { id: "harvey-ai", name: "Harvey AI", category: "vertical" as const, pricingTier: "enterprise" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://harvey.ai" },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log(`Seeding ${toolsSeed.length} tools...`);

  // Upsert tools (idempotent)
  for (const t of toolsSeed) {
    await db
      .insert(toolsTable)
      .values({
        ...t,
        radarScore: "0",
        subScores: {
          adoptionMomentum: 0,
          developerSentiment: 0,
          enterpriseReadiness: 0,
          recency: 0,
          buzz: 0,
        },
        signalSources: [],
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: toolsTable.id,
        set: {
          name: t.name,
          category: t.category,
          pricingTier: t.pricingTier,
          selfHostable: t.selfHostable,
          githubUrl: t.githubUrl,
          websiteUrl: t.websiteUrl,
          npmPackage: "npmPackage" in t ? (t as { npmPackage: string }).npmPackage : null,
        },
      });
  }

  console.log(`✓ Seeded ${toolsSeed.length} tools successfully`);
}

main();
