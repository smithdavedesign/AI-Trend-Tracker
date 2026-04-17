import { getDb } from "@/lib/db";
import { scores, tools } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidar.vercel.app";

  // Latest score per tool (top 50 movers)
  const latestScores = await db
    .select({
      toolId: scores.toolId,
      radarScore: scores.radarScore,
      delta: scores.delta,
      weekOf: scores.weekOf,
    })
    .from(scores)
    .orderBy(desc(scores.weekOf))
    .limit(50);

  const toolIds = [...new Set(latestScores.map((s) => s.toolId))];
  const toolRows =
    toolIds.length > 0
      ? await db
          .select({
            id: tools.id,
            name: tools.name,
            category: tools.category,
            summary: tools.summary,
          })
          .from(tools)
          .where(inArray(tools.id, toolIds))
      : [];

  const toolMap = new Map(toolRows.map((t) => [t.id, t]));

  const items = latestScores
    .map((s) => {
      const tool = toolMap.get(s.toolId);
      if (!tool) return null;
      const score = Number(s.radarScore);
      const delta = s.delta === null ? null : Number(s.delta);

      return {
        id: `${siteUrl}/tool/${s.toolId}?week=${s.weekOf}`,
        url: `${siteUrl}/tool/${s.toolId}`,
        title: `${tool.name}: RadarScore ${score.toFixed(1)}${delta === null ? "" : ` (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`}`,
        content_text: tool.summary ?? `${tool.name} scored ${score.toFixed(1)} in ${tool.category} for week of ${s.weekOf}.`,
        date_published: new Date(s.weekOf).toISOString(),
        tags: [tool.category],
        _radar_score: score,
        _delta: delta,
        _category: tool.category,
        _week_of: s.weekOf,
      };
    })
    .filter(Boolean);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "AIRadar — AI Tool Intelligence",
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: "Weekly AI tool RadarScores and trend updates across 50+ tools.",
    items,
  };

  return Response.json(feed, {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
