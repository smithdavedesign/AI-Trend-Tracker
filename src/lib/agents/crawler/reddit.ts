import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
}

/**
 * Crawl Reddit for mentions of a tool.
 * Uses the public JSON search endpoint (no auth required, rate-limited).
 */
export async function crawlReddit(tool: ToolInput): Promise<Signal | null> {
  const query = encodeURIComponent(tool.name);
  const url = `https://www.reddit.com/search.json?q=${query}&sort=new&t=month&limit=100`;

  const res = await fetch(url, {
    headers: { "User-Agent": "AIRadar/1.0 (educational research)" },
  });

  if (!res.ok) return null;

  const json = await res.json();
  const posts = json?.data?.children ?? [];

  // Count posts and comments
  const postCount30d = posts.length;
  const commentCount30d = posts.reduce(
    (sum: number, p: { data?: { num_comments?: number } }) =>
      sum + (p.data?.num_comments ?? 0),
    0
  );

  // Collect unique subreddits
  const subreddits = new Set<string>();
  for (const p of posts) {
    if (p.data?.subreddit) {
      subreddits.add(p.data.subreddit);
    }
  }

  // Simple sentiment from upvote ratio — crude but no NLP needed
  const sentiments = posts
    .map((p: { data?: { upvote_ratio?: number } }) => p.data?.upvote_ratio ?? 0.5)
    .filter((r: number) => r > 0);
  const avgSentiment =
    sentiments.length > 0
      ? (sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length - 0.5) * 2
      : 0;

  return {
    toolId: tool.id,
    source: "reddit",
    rawData: {
      postCount30d,
      commentCount30d,
      avgSentiment: Math.round(avgSentiment * 1000) / 1000,
      subredditsActive: Array.from(subreddits),
    },
    fetchedAt: new Date().toISOString(),
  };
}
