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

  const all = await res.json();
  if (!Array.isArray(all)) return null;

  // The API orders by creation, not publication, and includes drafts and
  // prereleases — so releases[0] can be an old prerelease. Use published
  // releases only, newest first.
  const releases = (
    all as { published_at?: string | null; draft?: boolean; prerelease?: boolean; tag_name?: string }[]
  )
    .filter((r) => !r.draft && !r.prerelease && r.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime());
  if (releases.length === 0) return null;

  // Count releases in last 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentReleases = releases.filter(
    (r) => new Date(r.published_at!).getTime() > ninetyDaysAgo
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
