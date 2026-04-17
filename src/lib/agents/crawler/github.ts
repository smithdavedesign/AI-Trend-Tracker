import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
  githubUrl?: string | null;
}

/**
 * Crawl GitHub API for repository signals.
 * Requires GITHUB_TOKEN env var for higher rate limits.
 */
export async function crawlGitHub(tool: ToolInput): Promise<Signal | null> {
  if (!tool.githubUrl) return null;

  const match = tool.githubUrl.match(
    /github\.com\/([^/]+)\/([^/]+)/
  );
  if (!match) return null;

  const [, owner, repo] = match;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const baseUrl = "https://api.github.com";

  // Fetch repo info
  const repoRes = await fetch(`${baseUrl}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();

  // Fetch releases for recency
  const releasesRes = await fetch(
    `${baseUrl}/repos/${owner}/${repo}/releases?per_page=20`,
    { headers }
  );
  const releases = releasesRes.ok ? await releasesRes.json() : [];

  // Estimate stars growth (30d) — use stargazers page count heuristic
  // In production, you'd use the starring timestamps API or store history
  const starsGrowth30d = Math.round(repoData.stargazers_count * 0.02); // ~2% monthly estimate

  // Commit frequency (last 90 days) — use participation stats
  const participationRes = await fetch(
    `${baseUrl}/repos/${owner}/${repo}/stats/participation`,
    { headers }
  );
  const participation = participationRes.ok ? await participationRes.json() : null;
  const last13Weeks = participation?.all?.slice(-13) ?? [];
  const totalCommits90d = last13Weeks.reduce(
    (sum: number, w: number) => sum + w,
    0
  );
  const commitFrequency90d = last13Weeks.length > 0
    ? Math.round((totalCommits90d / last13Weeks.length) * 100) / 100
    : 0;

  // Last release date
  const lastRelease = Array.isArray(releases) && releases.length > 0
    ? releases[0]
    : null;

  return {
    toolId: tool.id,
    source: "github",
    rawData: {
      stars: repoData.stargazers_count ?? 0,
      starsGrowth30d,
      forks: repoData.forks_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      lastReleaseDate: lastRelease?.published_at ?? null,
      commitFrequency90d,
    },
    fetchedAt: new Date().toISOString(),
  };
}
