import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
}

/**
 * Crawl ArXiv for academic papers mentioning a tool.
 * Uses the ArXiv API (Atom/XML over HTTP).
 */
export async function crawlArXiv(tool: ToolInput): Promise<Signal | null> {
  const query = encodeURIComponent(tool.name);
  const url = `https://export.arxiv.org/api/query?search_query=all:${query}&sortBy=submittedDate&sortOrder=descending&max_results=50`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const text = await res.text();

  // Simple XML parsing — count <entry> tags
  const entries = text.match(/<entry>/g);
  const paperCount = entries?.length ?? 0;

  // Count papers from last 30 days by checking <published> dates
  const publishedDates =
    text.match(/<published>([^<]+)<\/published>/g) ?? [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let recentPapers30d = 0;
  for (const tag of publishedDates) {
    const dateStr = tag.replace(/<\/?published>/g, "");
    const pubDate = new Date(dateStr).getTime();
    if (pubDate > thirtyDaysAgo) {
      recentPapers30d++;
    }
  }

  return {
    toolId: tool.id,
    source: "arxiv",
    rawData: {
      paperCount,
      recentPapers30d,
    },
    fetchedAt: new Date().toISOString(),
  };
}
