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

  // ─── LLM (additions) ───────────────────────────────────
  { id: "gemma", name: "Gemma", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/google-deepmind/gemma", websiteUrl: "https://ai.google.dev/gemma" },
  { id: "falcon", name: "Falcon", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/tiiuae/falcon-7b", websiteUrl: "https://falconllm.tii.ae" },
  { id: "deepseek-r1", name: "DeepSeek-R1", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/deepseek-ai/DeepSeek-R1", websiteUrl: "https://deepseek.com" },
  { id: "openai-o3", name: "OpenAI o3", category: "llm" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://openai.com/o3" },
  { id: "yi", name: "Yi", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/01-ai/Yi", websiteUrl: "https://01.ai" },
  { id: "codellama", name: "Code Llama", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/meta-llama/codellama", websiteUrl: "https://llama.meta.com" },
  { id: "jamba", name: "Jamba", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/AI21Labs/Jamba", websiteUrl: "https://ai21.com" },
  { id: "nous-hermes", name: "Nous Hermes", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/NousResearch/Hermes-3-Llama-3.1-8B", websiteUrl: "https://nousresearch.com" },
  { id: "zephyr", name: "Zephyr", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/huggingface/alignment-handbook", websiteUrl: "https://huggingface.co/HuggingFaceH4/zephyr-7b-beta" },
  { id: "internlm", name: "InternLM", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/InternLM/InternLM", websiteUrl: "https://internlm.org" },
  { id: "gemini-flash", name: "Gemini Flash", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://ai.google.dev" },
  { id: "llava", name: "LLaVA", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/haotian-liu/LLaVA", websiteUrl: "https://llava-vl.github.io" },
  { id: "stablelm", name: "StableLM", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/Stability-AI/StableLM", websiteUrl: "https://stability.ai" },
  { id: "reka", name: "Reka Core", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://reka.ai" },
  { id: "solar", name: "SOLAR", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/upstage-ai/SOLAR-10.7B", websiteUrl: "https://upstage.ai" },
  { id: "phi-4", name: "Phi-4", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/Phi-4", websiteUrl: "https://azure.microsoft.com/en-us/products/phi" },
  { id: "openchat", name: "OpenChat", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/imoneoi/openchat", websiteUrl: "https://openchat.team" },
  { id: "orca", name: "Orca 2", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/Orca", websiteUrl: "https://www.microsoft.com/en-us/research/project/orca" },
  { id: "command-a", name: "Command A", category: "llm" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://cohere.com/command" },
  { id: "llama4", name: "Llama 4", category: "llm" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/meta-llama/llama-models", websiteUrl: "https://llama.meta.com" },

  // ─── Coding (additions) ────────────────────────────────
  { id: "cline", name: "Cline", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/cline/cline", websiteUrl: "https://cline.bot" },
  { id: "devin", name: "Devin", category: "coding" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://cognition.ai" },
  { id: "lovable", name: "Lovable", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://lovable.dev" },
  { id: "plandex", name: "Plandex", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/plandex-ai/plandex", websiteUrl: "https://plandex.ai" },
  { id: "sweep", name: "Sweep", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/sweepai/sweep", websiteUrl: "https://sweep.dev" },
  { id: "amazon-q", name: "Amazon Q Developer", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://aws.amazon.com/q/developer" },
  { id: "cody", name: "Sourcegraph Cody", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/sourcegraph/cody", websiteUrl: "https://sourcegraph.com/cody" },
  { id: "jetbrains-ai", name: "JetBrains AI", category: "coding" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://www.jetbrains.com/ai" },
  { id: "tabby", name: "Tabby", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/TabbyML/tabby", websiteUrl: "https://tabbyml.com" },
  { id: "codegpt", name: "CodeGPT", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/JudiniLabs/code-gpt-docs", websiteUrl: "https://codegpt.co" },
  { id: "zed", name: "Zed", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/zed-industries/zed", websiteUrl: "https://zed.dev" },
  { id: "opendevin", name: "OpenHands", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/All-Hands-AI/OpenHands", websiteUrl: "https://all-hands.dev" },
  { id: "gpt-engineer", name: "GPT Engineer", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/AntonOsika/gpt-engineer", websiteUrl: "https://gptengineer.app" },
  { id: "refact-ai", name: "Refact.ai", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/smallcloudai/refact", websiteUrl: "https://refact.ai" },
  { id: "blackbox-ai", name: "Blackbox AI", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://blackbox.ai" },
  { id: "claude-code", name: "Claude Code", category: "coding" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://claude.ai/claude-code", npmPackage: "@anthropic-ai/claude-code" },
  { id: "amp", name: "Amp", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://ampcode.com" },
  { id: "devika", name: "Devika", category: "coding" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/stitionai/devika", websiteUrl: null },
  { id: "pieces", name: "Pieces for Developers", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://pieces.app" },
  { id: "kiro", name: "Kiro", category: "coding" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://kiro.dev" },

  // ─── Agents (additions) ────────────────────────────────
  { id: "llamaindex", name: "LlamaIndex", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/run-llama/llama_index", websiteUrl: "https://llamaindex.ai", npmPackage: "llamaindex" },
  { id: "agentgpt", name: "AgentGPT", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/reworkd/AgentGPT", websiteUrl: "https://agentgpt.reworkd.ai" },
  { id: "babyagi", name: "BabyAGI", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/yoheinakajima/babyagi", websiteUrl: null },
  { id: "superagent", name: "Superagent", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/superagent-ai/superagent", websiteUrl: "https://superagent.sh" },
  { id: "letta", name: "Letta", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/letta-ai/letta", websiteUrl: "https://letta.ai" },
  { id: "metagpt", name: "MetaGPT", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/geekan/MetaGPT", websiteUrl: "https://deepwisdom.ai" },
  { id: "pydantic-ai", name: "Pydantic AI", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/pydantic/pydantic-ai", websiteUrl: "https://ai.pydantic.dev" },
  { id: "haystack", name: "Haystack", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/deepset-ai/haystack", websiteUrl: "https://haystack.deepset.ai", npmPackage: "haystack-ai" },
  { id: "botpress", name: "Botpress", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/botpress/botpress", websiteUrl: "https://botpress.com" },
  { id: "voiceflow", name: "Voiceflow", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://voiceflow.com" },
  { id: "composio", name: "Composio", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/ComposioHQ/composio", websiteUrl: "https://composio.dev", npmPackage: "composio-core" },
  { id: "relevance-ai", name: "Relevance AI", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://relevanceai.com" },
  { id: "phidata", name: "Agno (Phidata)", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/agno-agi/agno", websiteUrl: "https://agno.com" },
  { id: "cognee", name: "Cognee", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/topoteretes/cognee", websiteUrl: "https://cognee.ai" },
  { id: "magentic-one", name: "Magentic-One", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/microsoft/autogen/tree/main/python/packages/autogen-magentic-one", websiteUrl: "https://microsoft.github.io/autogen" },
  { id: "camel-ai", name: "CAMEL-AI", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/camel-ai/camel", websiteUrl: "https://camel-ai.org" },
  { id: "instructor", name: "Instructor", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/instructor-ai/instructor", websiteUrl: "https://python.useinstructor.com", npmPackage: "@instructor-ai/instructor" },
  { id: "griptape", name: "Griptape", category: "agents" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/griptape-ai/griptape", websiteUrl: "https://griptape.ai" },
  { id: "e2b", name: "E2B", category: "agents" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/e2b-dev/E2B", websiteUrl: "https://e2b.dev", npmPackage: "@e2b/code-interpreter" },
  { id: "vertex-ai-agents", name: "Vertex AI Agents", category: "agents" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://cloud.google.com/products/agent-builder" },

  // ─── Infrastructure (additions) ────────────────────────
  { id: "qdrant", name: "Qdrant", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/qdrant/qdrant", websiteUrl: "https://qdrant.tech", npmPackage: "@qdrant/js-client-rest" },
  { id: "pinecone", name: "Pinecone", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://pinecone.io", npmPackage: "@pinecone-database/pinecone" },
  { id: "weaviate", name: "Weaviate", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/weaviate/weaviate", websiteUrl: "https://weaviate.io", npmPackage: "weaviate-client" },
  { id: "milvus", name: "Milvus", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/milvus-io/milvus", websiteUrl: "https://milvus.io" },
  { id: "lancedb", name: "LanceDB", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/lancedb/lancedb", websiteUrl: "https://lancedb.com", npmPackage: "@lancedb/lancedb" },
  { id: "modal", name: "Modal", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://modal.com" },
  { id: "runpod", name: "RunPod", category: "infra" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://runpod.io" },
  { id: "fireworks-ai", name: "Fireworks AI", category: "infra" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://fireworks.ai", npmPackage: "fireworks-ai" },
  { id: "baseten", name: "Baseten", category: "infra" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://baseten.co" },
  { id: "bentoml", name: "BentoML", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/bentoml/BentoML", websiteUrl: "https://bentoml.com" },
  { id: "tgi", name: "Text Generation Inference", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/huggingface/text-generation-inference", websiteUrl: "https://huggingface.co/docs/text-generation-inference" },
  { id: "mlflow", name: "MLflow", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/mlflow/mlflow", websiteUrl: "https://mlflow.org" },
  { id: "wandb", name: "Weights & Biases", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/wandb/wandb", websiteUrl: "https://wandb.ai", npmPackage: "@wandb/sdk" },
  { id: "ray", name: "Ray", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/ray-project/ray", websiteUrl: "https://ray.io" },
  { id: "litellm", name: "LiteLLM", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/BerriAI/litellm", websiteUrl: "https://litellm.ai", npmPackage: "litellm" },
  { id: "langfuse", name: "Langfuse", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/langfuse/langfuse", websiteUrl: "https://langfuse.com", npmPackage: "langfuse" },
  { id: "helicone", name: "Helicone", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: true, githubUrl: "https://github.com/Helicone/helicone", websiteUrl: "https://helicone.ai" },
  { id: "portkey", name: "Portkey AI", category: "infra" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: "https://github.com/portkey-ai/gateway", websiteUrl: "https://portkey.ai", npmPackage: "portkey-ai" },
  { id: "truss", name: "Truss", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/basetenlabs/truss", websiteUrl: "https://truss.baseten.co" },
  { id: "sky-pilot", name: "SkyPilot", category: "infra" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/skypilot-org/skypilot", websiteUrl: "https://skypilot.readthedocs.io" },

  // ─── Vertical (additions) ──────────────────────────────
  { id: "dalle", name: "DALL-E 3", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://openai.com/dall-e-3" },
  { id: "flux", name: "FLUX.1", category: "vertical" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/black-forest-labs/flux", websiteUrl: "https://blackforestlabs.ai" },
  { id: "ideogram", name: "Ideogram", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://ideogram.ai" },
  { id: "leonardo-ai", name: "Leonardo AI", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://leonardo.ai" },
  { id: "adobe-firefly", name: "Adobe Firefly", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://firefly.adobe.com" },
  { id: "heygen", name: "HeyGen", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://heygen.com" },
  { id: "synthesia", name: "Synthesia", category: "vertical" as const, pricingTier: "paid" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://synthesia.io" },
  { id: "pika", name: "Pika", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://pika.art" },
  { id: "kling", name: "Kling", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://klingai.com" },
  { id: "descript", name: "Descript", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://descript.com" },
  { id: "assemblyai", name: "AssemblyAI", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://assemblyai.com", npmPackage: "assemblyai" },
  { id: "deepgram", name: "Deepgram", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://deepgram.com", npmPackage: "@deepgram/sdk" },
  { id: "luma-ai", name: "Luma AI", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://lumalabs.ai" },
  { id: "krea", name: "Krea AI", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://krea.ai" },
  { id: "copy-ai", name: "Copy.ai", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://copy.ai" },
  { id: "writesonic", name: "Writesonic", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://writesonic.com" },
  { id: "gamma", name: "Gamma", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://gamma.app" },
  { id: "whisper", name: "Whisper", category: "vertical" as const, pricingTier: "free" as const, selfHostable: true, githubUrl: "https://github.com/openai/whisper", websiteUrl: "https://openai.com/research/whisper" },
  { id: "d-id", name: "D-ID", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://d-id.com" },
  { id: "veed-io", name: "VEED.IO", category: "vertical" as const, pricingTier: "freemium" as const, selfHostable: false, githubUrl: null, websiteUrl: "https://veed.io" },
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
