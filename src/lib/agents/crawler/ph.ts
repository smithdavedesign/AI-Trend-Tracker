import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
}

const PH_API = "https://api.producthunt.com/v2/api/graphql";

/**
 * Crawl Product Hunt for launch votes and engagement data.
 * Requires PRODUCT_HUNT_TOKEN (free developer token from producthunt.com/v2/oauth/applications).
 */
export async function crawlProductHunt(tool: ToolInput): Promise<Signal | null> {
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) return null;

  const query = `{
    posts(query: ${JSON.stringify(tool.name)}, order: VOTES, first: 5) {
      edges {
        node {
          name
          votesCount
          commentsCount
          createdAt
        }
      }
    }
  }`;

  try {
    const res = await fetch(PH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      data?: { posts?: { edges?: Array<{ node: { name: string; votesCount: number; commentsCount: number; createdAt: string } }> } };
    };

    const edges = json.data?.posts?.edges ?? [];
    if (edges.length === 0) return null;

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = edges.filter((e) => new Date(e.node.createdAt) > cutoff);

    const totalVotes = edges.reduce((sum, e) => sum + e.node.votesCount, 0);
    const recentVotes = recent.reduce((sum, e) => sum + e.node.votesCount, 0);
    const totalComments = edges.reduce((sum, e) => sum + e.node.commentsCount, 0);

    return {
      toolId: tool.id,
      source: "ph",
      rawData: {
        totalVotes,
        recentVotes30d: recentVotes,
        launchCount: edges.length,
        recentLaunches30d: recent.length,
        totalComments,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
