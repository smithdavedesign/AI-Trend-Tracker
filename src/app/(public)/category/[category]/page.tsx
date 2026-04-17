import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { ToolCard } from "@/components/ui/tool-card";
import { SortControls } from "@/components/ui/sort-controls";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["llm", "coding", "agents", "infra", "vertical"] as const;

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  llm: { title: "LLMs", description: "Large language models — ChatGPT, Claude, Gemini, and more." },
  coding: { title: "Coding Tools", description: "AI-powered coding assistants and code generators." },
  agents: { title: "AI Agents", description: "Autonomous agent frameworks and orchestration tools." },
  infra: { title: "Infrastructure", description: "Model serving, vector databases, and deployment tools." },
  vertical: { title: "Vertical AI", description: "Domain-specific AI tools for search, design, writing, and more." },
};

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
  searchParams,
}: Readonly<{
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}>) {
  const { category } = await params;
  const { sort = "radar_score" } = await searchParams;

  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    notFound();
  }

  const meta = CATEGORY_META[category];
  const db = getDb();

  let orderBy;
  if (sort === "name") {
    orderBy = asc(tools.name);
  } else if (sort === "recency") {
    orderBy = desc(tools.lastUpdated);
  } else {
    orderBy = desc(tools.radarScore);
  }

  const toolList = await db
    .select()
    .from(tools)
    .where(eq(tools.category, category))
    .orderBy(orderBy);

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

  // For adoption/recency sub-score sorts, post-sort by the actual sub-score value
  const sortedToolList =
    sort === "adoption" || sort === "recency"
      ? [...toolList].sort((a, b) => {
          const subKey =
            sort === "adoption" ? "adoptionMomentum" : "recency";
          const aVal = ((a.subScores as Record<string, number>)?.[subKey]) ?? 0;
          const bVal = ((b.subScores as Record<string, number>)?.[subKey]) ?? 0;
          return bVal - aVal;
        })
      : toolList;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{meta.title}</h1>
        <p className="mt-2 text-muted">{meta.description}</p>
      </div>

      <div className="mb-6">
        <Suspense>
          <SortControls currentSort={sort} />
        </Suspense>
      </div>

      <div className="space-y-2">
        {sortedToolList.length > 0 ? (
          sortedToolList.map((tool, i) => (
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
