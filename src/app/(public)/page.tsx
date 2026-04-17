import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { desc, inArray, isNotNull } from "drizzle-orm";
import { ToolCard } from "@/components/ui/tool-card";
import Link from "next/link";

export const revalidate = 3600; // ISR: 1 hour

const CATEGORIES = [
  { id: "llm", label: "LLMs", emoji: "🧠" },
  { id: "coding", label: "Coding", emoji: "💻" },
  { id: "agents", label: "Agents", emoji: "🤖" },
  { id: "infra", label: "Infra", emoji: "⚙️" },
  { id: "vertical", label: "Vertical", emoji: "🎯" },
];

export default async function HomePage() {
  const db = getDb();

  // Fetch top 10 tools overall
  const topTools = await db
    .select()
    .from(tools)
    .orderBy(desc(tools.radarScore))
    .limit(10);

  // Fetch latest scores for deltas
  const toolIds = topTools.map((t) => t.id);
  const latestScores = toolIds.length
    ? await db
        .select({ toolId: scores.toolId, delta: scores.delta })
        .from(scores)
        .where(inArray(scores.toolId, toolIds))
        .orderBy(desc(scores.weekOf))
    : [];

  // Deduplicate to latest delta per tool
  const deltaMap = new Map<string, string | null>();
  for (const s of latestScores) {
    if (!deltaMap.has(s.toolId)) {
      deltaMap.set(s.toolId, s.delta);
    }
  }

  // Fetch top movers (biggest positive delta)
  const movers = await db
    .select({
      toolId: scores.toolId,
      radarScore: scores.radarScore,
      delta: scores.delta,
      weekOf: scores.weekOf,
    })
    .from(scores)
    .where(isNotNull(scores.delta))
    .orderBy(desc(scores.delta))
    .limit(5);

  const moverToolIds = movers.map((m) => m.toolId);
  const moverTools = moverToolIds.length
    ? await db
        .select({ id: tools.id, name: tools.name })
        .from(tools)
        .where(inArray(tools.id, moverToolIds))
    : [];

  const moverNameMap = new Map(moverTools.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          AI Tool Intelligence,{" "}
          <span className="text-primary">Automated</span>
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Track, compare, and discover 50+ AI tools with weekly RadarScores
          powered by 6 data sources. No opinions — just signals.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Top 10 Leaderboard */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top 10 AI Tools</h2>
            <Link
              href="/leaderboard"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {topTools && topTools.length > 0 ? (
              topTools.map((tool, i) => (
                <ToolCard
                  key={tool.id}
                  rank={i + 1}
                  id={tool.id}
                  name={tool.name}
                  category={tool.category}
                  radarScore={Number(tool.radarScore)}
                  delta={Number(deltaMap.get(tool.id) ?? 0) || null}
                  pricingTier={tool.pricingTier}
                  selfHostable={tool.selfHostable}
                />
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted">
                <p>No tools scored yet. Run the pipeline to populate data.</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Top Movers */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-3">🔥 Top Movers This Week</h3>
            {movers && movers.length > 0 ? (
              <ul className="space-y-2">
                {movers.map((m) => (
                  <li key={m.toolId} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/tool/${m.toolId}`}
                      className="text-primary hover:underline truncate"
                    >
                      {moverNameMap.get(m.toolId) ?? m.toolId}
                    </Link>
                    <span className="text-secondary font-medium">
                      ↑ {Number(m.delta ?? 0).toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Movers will appear after the first pipeline run.
              </p>
            )}
          </div>

          {/* Subscribe CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold mb-2">📬 Weekly Digest</h3>
            <p className="text-sm text-muted mb-3">
              Get the top AI tool movers and shakers delivered to your inbox every Monday.
            </p>
            <form action="/api/subscribe" method="POST" className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-3">📊 Platform Stats</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-xs text-muted">Tools Tracked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">6</div>
                <div className="text-xs text-muted">Data Sources</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">5</div>
                <div className="text-xs text-muted">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">Weekly</div>
                <div className="text-xs text-muted">Refresh Rate</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
