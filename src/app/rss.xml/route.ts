import { getDb } from "@/lib/db";
import { scores, tools } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidar.vercel.app";

  // Get latest scores
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
          .select({ id: tools.id, name: tools.name, category: tools.category })
          .from(tools)
          .where(inArray(tools.id, toolIds))
      : [];

  const toolMap = new Map(toolRows.map((t) => [t.id, t]));

  const items = latestScores
    .map((s) => {
      const tool = toolMap.get(s.toolId);
      if (!tool) return null;
      const score = Number(s.radarScore);
      const delta = Number(s.delta ?? 0);
      const arrow = delta >= 0 ? "↑" : "↓";
      const deltaStr =
        s.delta !== null ? ` (${arrow}${Math.abs(delta).toFixed(1)})` : "";

      return `    <item>
      <title>${escapeXml(tool.name)}: RadarScore ${score.toFixed(1)}${deltaStr}</title>
      <link>${siteUrl}/tool/${s.toolId}</link>
      <guid>${siteUrl}/tool/${s.toolId}?week=${s.weekOf}</guid>
      <pubDate>${new Date(s.weekOf).toUTCString()}</pubDate>
      <description>${escapeXml(tool.name)} scored ${score.toFixed(1)} in ${tool.category} for week of ${s.weekOf}.</description>
      <category>${escapeXml(tool.category)}</category>
    </item>`;
    })
    .filter(Boolean)
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AIRadar — AI Tool Intelligence</title>
    <link>${siteUrl}</link>
    <description>Weekly AI tool RadarScores and trend updates across 50+ tools.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
