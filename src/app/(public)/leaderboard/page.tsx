import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { ToolCard } from "@/components/ui/tool-card";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Full AI tool leaderboard ranked by RadarScore. 50+ tools across 5 categories.",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort = "radar_score" } = await searchParams;
  const db = getDb();

  const conditions = category ? eq(tools.category, category) : undefined;
  const orderBy = sort === "name" ? asc(tools.name) : desc(tools.radarScore);

  const toolList = conditions
    ? await db.select().from(tools).where(conditions).orderBy(orderBy)
    : await db.select().from(tools).orderBy(orderBy);

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

  const categories = [
    { id: "", label: "All" },
    { id: "llm", label: "LLMs" },
    { id: "coding", label: "Coding" },
    { id: "agents", label: "Agents" },
    { id: "infra", label: "Infra" },
    { id: "vertical", label: "Vertical" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
      <p className="text-muted mb-6">
        All {toolList.length} tools ranked by RadarScore.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const isActive = (category ?? "") === cat.id;
          const params = new URLSearchParams();
          if (cat.id) params.set("category", cat.id);
          if (sort !== "radar_score") params.set("sort", sort);
          const href = `/leaderboard${params.toString() ? `?${params}` : ""}`;

          return (
            <Link
              key={cat.id}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Tool list */}
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
            No tools found. Run the pipeline to populate data.
          </div>
        )}
      </div>
    </div>
  );
}
