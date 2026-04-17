import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
}

/**
 * Crawl Hacker News Algolia API for mentions of a tool.
 */
export async function crawlHackerNews(tool: ToolInput): Promise<Signal | null> {
  const query = encodeURIComponent(tool.name);

  // Search stories from last 30 days
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&numericFilters=created_at_i>${thirtyDaysAgo}&hitsPerPage=100`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const hits = json?.hits ?? [];

  // Count front page hits (proxy: stories with > 50 points)
  const frontPageHits30d = hits.filter(
    (h: { points?: number }) => (h.points ?? 0) > 50
  ).length;

  const totalPoints30d = hits.reduce(
    (sum: number, h: { points?: number }) => sum + (h.points ?? 0),
    0
  );

  const commentCount30d = hits.reduce(
    (sum: number, h: { num_comments?: number }) =>
      sum + (h.num_comments ?? 0),
    0
  );

  // Simple sentiment: higher points ratio = more positive community response
  // Normalize to -1..1 range: <10 avg points = negative, >100 = very positive
  const avgPoints = hits.length > 0 ? totalPoints30d / hits.length : 0;
  const avgSentiment = Math.max(-1, Math.min(1, (avgPoints - 50) / 100));

  return {
    toolId: tool.id,
    source: "hn",
    rawData: {
      frontPageHits30d,
      totalPoints30d,
      commentCount30d,
      avgSentiment: Math.round(avgSentiment * 1000) / 1000,
    },
    fetchedAt: new Date().toISOString(),
  };
}
