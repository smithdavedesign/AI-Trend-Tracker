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
}: Readonly<{
  searchParams: Promise<{ category?: string; sort?: string }>;
}>) {
  const { category, sort = "radar_score" } = await searchParams;
  const db = getDb();

  const conditions = category ? eq(tools.category, category) : undefined;
  const orderBy = sort === "name" ? asc(tools.name) : desc(tools.radarScore);

  const toolList = conditions
    ? await db.select().from(tools).where(conditions).orderBy(orderBy)
    : await db.select().from(tools).orderBy(orderBy);

  const toolIds = toolList.map((t) => t.id);

  // Fetch last 8 weeks of scores for deltas + sparklines in one query
  const scoreHistory = toolIds.length
    ? await db
        .select({ toolId: scores.toolId, radarScore: scores.radarScore, weekOf: scores.weekOf, delta: scores.delta })
        .from(scores)
        .where(inArray(scores.toolId, toolIds))
        .orderBy(scores.toolId, asc(scores.weekOf))
    : [];

  const deltaMap = new Map<string, string | null>();
  const sparklineMap = new Map<string, number[]>();

  for (const s of scoreHistory) {
    if (!deltaMap.has(s.toolId)) {
      // first entry per tool in desc order isn't guaranteed here — collect all then pick latest
    }
    const arr = sparklineMap.get(s.toolId) ?? [];
    arr.push(Number(s.radarScore));
    sparklineMap.set(s.toolId, arr);
  }

  // Latest delta: last entry per tool (scoreHistory is asc by weekOf)
  const latestByTool = new Map<string, typeof scoreHistory[number]>();
  for (const s of scoreHistory) {
    latestByTool.set(s.toolId, s); // asc order, so last write = most recent
  }
  for (const [toolId, s] of latestByTool) {
    deltaMap.set(toolId, s.delta);
  }

  // Trim sparklines to last 8 weeks
  for (const [toolId, arr] of sparklineMap) {
    sparklineMap.set(toolId, arr.slice(-8));
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

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const isActive = (category ?? "") === cat.id;
          const params = new URLSearchParams();
          if (cat.id) params.set("category", cat.id);
          if (sort !== "radar_score") params.set("sort", sort);
          const qs = params.toString();
          const href = qs ? `/leaderboard?${qs}` : "/leaderboard";

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
              sparkline={sparklineMap.get(tool.id)}
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
