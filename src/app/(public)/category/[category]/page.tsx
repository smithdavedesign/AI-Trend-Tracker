import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { ToolCard } from "@/components/ui/tool-card";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 3600;

const VALID_CATEGORIES = ["llm", "coding", "agents", "infra", "vertical"] as const;

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  llm: { title: "LLMs", description: "Large language models — ChatGPT, Claude, Gemini, and more." },
  coding: { title: "Coding Tools", description: "AI-powered coding assistants and code generators." },
  agents: { title: "AI Agents", description: "Autonomous agent frameworks and orchestration tools." },
  infra: { title: "Infrastructure", description: "Model serving, vector databases, and deployment tools." },
  vertical: { title: "Vertical AI", description: "Domain-specific AI tools for search, design, writing, and more." },
};

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    notFound();
  }

  const meta = CATEGORY_META[category];
  const db = getDb();

  const toolList = await db
    .select()
    .from(tools)
    .where(eq(tools.category, category))
    .orderBy(desc(tools.radarScore));

  // Fetch deltas
  const toolIds = toolList.map((t) => t.id);
  const scoreList = toolIds.length
    ? await db
        .select({ toolId: scores.toolId, delta: scores.delta })
        .from(scores)
        .where(inArray(scores.toolId, toolIds))
        .orderBy(desc(scores.weekOf))
    : [];

  const deltaMap = new Map<string, string | null>();
  for (const s of scoreList) {
    if (!deltaMap.has(s.toolId)) {
      deltaMap.set(s.toolId, s.delta);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{meta.title}</h1>
        <p className="mt-2 text-muted">{meta.description}</p>
      </div>

      <div className="space-y-2">
        {toolList.length > 0 ? (
          toolList.map((tool, i) => (
            <ToolCard
              key={tool.id}
              rank={i + 1}
              id={tool.id}
              name={tool.name}
              category={tool.category}
              radarScore={Number(tool.radarScore)}
              delta={Number(deltaMap.get(tool.id) ?? 0) || null}
              pricingTier={tool.pricingTier}
              selfHostable={tool.selfHostable}
            />
          ))
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted">
            No tools in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
