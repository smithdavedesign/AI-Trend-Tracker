import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { lt, asc, inArray, desc } from "drizzle-orm";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Graveyard",
  description: "AI tools that have stagnated or declined. Formerly rising tools now showing signs of abandonment.",
};

export default async function GraveyardPage() {
  const db = getDb();

  // Find tools with declining scores (negative delta) or very low recency
  const decliningScores = await db
    .select({
      toolId: scores.toolId,
      radarScore: scores.radarScore,
      delta: scores.delta,
      weekOf: scores.weekOf,
    })
    .from(scores)
    .where(lt(scores.delta, "-5"))
    .orderBy(asc(scores.delta))
    .limit(20);

  const staleTools = await db
    .select()
    .from(tools)
    .where(lt(tools.radarScore, "15"))
    .orderBy(asc(tools.radarScore));

  // Merge and deduplicate
  const decliningIds = new Set(decliningScores.map((d) => d.toolId));
  const allGraveyardIds = new Set([
    ...decliningIds,
    ...staleTools.map((t) => t.id),
  ]);

  // Fetch full tool data for declining tools
  const decliningToolData = decliningIds.size
    ? await db.select().from(tools).where(inArray(tools.id, Array.from(decliningIds)))
    : [];

  const allGraveyardTools = [
    ...decliningToolData,
    ...staleTools.filter((t) => !decliningIds.has(t.id)),
  ];

  // Build delta map
  const deltaMap = new Map<string, string>();
  for (const d of decliningScores) {
    if (d.delta && !deltaMap.has(d.toolId)) {
      deltaMap.set(d.toolId, d.delta);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">☠️ Tool Graveyard</h1>
      <p className="text-muted mb-8">
        AI tools showing signs of decline or stagnation. Low RadarScores, negative momentum,
        or lack of recent development activity.
      </p>

      {allGraveyardTools.length > 0 ? (
        <div className="space-y-3">
          {allGraveyardTools.map((tool) => {
            const delta = deltaMap.get(tool.id);
            const subScores = (tool.subScores as Record<string, number>) ?? {};
            const recency = subScores.recency ?? 0;

            return (
              <div
                key={tool.id}
                className="rounded-xl border border-border bg-card p-4 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{tool.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                      <span className="capitalize">{tool.category}</span>
                      <span>Score: {Number(tool.radarScore).toFixed(1)}</span>
                      <span>Recency: {recency.toFixed(0)}/100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {delta !== undefined && (
                      <span className="text-danger font-medium text-sm">
                        ↓ {Math.abs(Number(delta)).toFixed(1)}
                      </span>
                    )}
                    <div className="text-xs text-muted mt-1">
                      Last updated: {tool.lastUpdated ? new Date(tool.lastUpdated).toLocaleDateString() : "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted">
          <p className="text-lg mb-2">No tools in the graveyard yet.</p>
          <p className="text-sm">
            Tools appear here after showing consistent decline or stagnation over multiple weeks.
          </p>
        </div>
      )}
    </div>
  );
}
