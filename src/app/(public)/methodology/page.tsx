import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How AIRadar computes RadarScores: data sources, scoring dimensions, and update frequency.",
};

const DATA_SOURCES = [
  {
    name: "GitHub",
    icon: "📦",
    description: "Stars, forks, commit frequency, release cadence. Measures open-source health and developer adoption.",
  },
  {
    name: "Reddit",
    icon: "💬",
    description: "Post count, comment volume, upvote-ratio sentiment across AI subreddits. Captures grassroots developer opinion.",
  },
  {
    name: "Hacker News",
    icon: "🔶",
    description: "Front page appearances, total points, comment engagement. Reflects technical community interest.",
  },
  {
    name: "ArXiv",
    icon: "📄",
    description: "Academic paper mentions and recent publications. Tracks research-level relevance and innovation.",
  },
  {
    name: "G2",
    icon: "⭐",
    description: "Enterprise reviews, star ratings, satisfaction scores. Represents real-world business adoption.",
  },
  {
    name: "Changelog",
    icon: "📋",
    description: "Release frequency, days since last release, version tracking. Measures active development momentum.",
  },
];

const DIMENSIONS = [
  {
    name: "Adoption Momentum",
    weight: "20%",
    description: "Growth velocity — how fast a tool is gaining users. Driven by GitHub stars growth and G2 review growth.",
  },
  {
    name: "Developer Sentiment",
    weight: "20%",
    description: "Community opinion — what developers actually think. Aggregated from Reddit upvote ratios, HN sentiment, and G2 satisfaction.",
  },
  {
    name: "Enterprise Readiness",
    weight: "20%",
    description: "Business viability — can enterprises adopt this? Based on G2 rating, review volume, and project maturity signals.",
  },
  {
    name: "Recency",
    weight: "20%",
    description: "Active development — is the project alive? Measured by days since last release, release cadence, and commit frequency.",
  },
  {
    name: "Buzz",
    weight: "20%",
    description: "Mindshare — how much is the community talking about it? HN front page hits, Reddit post volume, and ArXiv papers.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Methodology</h1>
      <p className="text-muted mb-8">
        How we compute RadarScores — transparent, automated, and opinion-free.
      </p>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">1️⃣</span>
            <div>
              <h3 className="font-semibold">Crawl</h3>
              <p className="text-sm text-muted">
                Every Monday at 6AM UTC, our automated pipeline crawls 6 data sources for each tool,
                collecting fresh signals about adoption, sentiment, and activity.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl">2️⃣</span>
            <div>
              <h3 className="font-semibold">Score</h3>
              <p className="text-sm text-muted">
                Raw signals are normalized into 5 sub-dimensions (0-100 each),
                then combined with equal weights into a single RadarScore.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl">3️⃣</span>
            <div>
              <h3 className="font-semibold">Compare</h3>
              <p className="text-sm text-muted">
                Week-over-week deltas track momentum. AI-generated comparison blurbs
                help you understand relative strengths between tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Data Sources</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DATA_SOURCES.map((source) => (
            <div
              key={source.name}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{source.icon}</span>
                <h3 className="font-semibold">{source.name}</h3>
              </div>
              <p className="text-sm text-muted">{source.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring Dimensions */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Scoring Dimensions</h2>
        <div className="space-y-3">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.name}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{dim.name}</h3>
                <span className="text-sm text-primary font-medium">
                  {dim.weight}
                </span>
              </div>
              <p className="text-sm text-muted">{dim.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Update Cadence */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Update Cadence</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-primary">Top 50 Tools</h3>
              <p className="text-sm text-muted">Updated every week (Monday 6AM UTC)</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted">Remaining Tools</h3>
              <p className="text-sm text-muted">Updated monthly (every 4th Monday)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Formula */}
      <section>
        <h2 className="text-xl font-bold mb-4">Formula</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <code className="block text-sm font-mono text-center py-4">
            RadarScore = (Adoption × 0.2) + (Sentiment × 0.2) + (Enterprise × 0.2) + (Recency × 0.2) + (Buzz × 0.2)
          </code>
          <p className="text-sm text-muted mt-4">
            When a sub-score has no available data, its weight is redistributed proportionally
            across the available dimensions. All sub-scores are clamped to 0-100.
          </p>
        </div>
      </section>
    </div>
  );
}
