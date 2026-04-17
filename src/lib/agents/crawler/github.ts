import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
  githubUrl?: string | null;
  npmPackage?: string | null;
}

export async function crawlGitHub(tool: ToolInput): Promise<Signal | null> {
  if (!tool.githubUrl) return null;

  const match = /github\.com\/([^/]+)\/([^/]+)/.exec(tool.githubUrl);
  if (!match) return null;

  const [, owner, repo] = match;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const baseUrl = "https://api.github.com";

  const repoRes = await fetch(`${baseUrl}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();

  const releasesRes = await fetch(
    `${baseUrl}/repos/${owner}/${repo}/releases?per_page=20`,
    { headers }
  );
  const releases = releasesRes.ok ? await releasesRes.json() : [];

  const starsGrowth30d = Math.round(repoData.stargazers_count * 0.02);

  const participationRes = await fetch(
    `${baseUrl}/repos/${owner}/${repo}/stats/participation`,
    { headers }
  );
  const participation = participationRes.ok ? await participationRes.json() : null;
  const last13Weeks: number[] = participation?.all?.slice(-13) ?? [];
  const totalCommits90d = last13Weeks.reduce((sum, w) => sum + w, 0);
  const commitFrequency90d =
    last13Weeks.length > 0
      ? Math.round((totalCommits90d / last13Weeks.length) * 100) / 100
      : 0;

  const lastRelease =
    Array.isArray(releases) && releases.length > 0 ? releases[0] : null;

  // npm weekly downloads (public API, no auth required)
  let npmWeeklyDownloads: number | null = null;
  if (tool.npmPackage) {
    try {
      const npmRes = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(tool.npmPackage)}`
      );
      if (npmRes.ok) {
        const npmData = await npmRes.json();
        npmWeeklyDownloads = npmData.downloads ?? null;
      }
    } catch {
      // non-fatal — npm stats are supplemental
    }
  }

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
      ...(npmWeeklyDownloads === null ? {} : { npmWeeklyDownloads }),
    },
    fetchedAt: new Date().toISOString(),
  };
}
