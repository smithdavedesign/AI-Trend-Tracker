import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
  githubUrl?: string | null;
}

/**
 * Crawl changelog/release info from GitHub releases or a known changelog URL.
 */
export async function crawlChangelog(tool: ToolInput): Promise<Signal | null> {
  // Primary source: GitHub releases API
  if (tool.githubUrl) {
    const match = tool.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, owner, repo] = match;
      return crawlGitHubReleases(tool.id, owner, repo);
    }
  }

  return null;
}

async function crawlGitHubReleases(
  toolId: string,
  owner: string,
  repo: string
): Promise<Signal | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=30`,
    { headers }
  );

  if (!res.ok) return null;

  const releases = await res.json();
  if (!Array.isArray(releases) || releases.length === 0) return null;

  // Count releases in last 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentReleases = releases.filter(
    (r: { published_at?: string }) =>
      r.published_at && new Date(r.published_at).getTime() > ninetyDaysAgo
  );

  const latest = releases[0];
  const daysSinceLastRelease = latest.published_at
    ? Math.floor(
        (Date.now() - new Date(latest.published_at).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : 999;

  return {
    toolId,
    source: "changelog",
    rawData: {
      releasesLast90d: recentReleases.length,
      daysSinceLastRelease,
      latestVersion: latest.tag_name ?? null,
    },
    fetchedAt: new Date().toISOString(),
  };
}
