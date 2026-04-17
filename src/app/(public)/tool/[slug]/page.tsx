import { getDb } from "@/lib/db";
import { tools, scores, signals, comparisons } from "@/lib/db/schema";
import { eq, desc, or, inArray, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RadarScoreChart } from "@/components/charts/radar-score-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { ScoreBadge, DeltaBadge } from "@/components/ui/score-badge";
import type { SubScores } from "@/lib/schemas";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [tool] = await db
    .select({ name: tools.name, category: tools.category, radarScore: tools.radarScore })
    .from(tools)
    .where(eq(tools.id, slug))
    .limit(1);

  if (!tool) return {};

  return {
    title: `${tool.name} — RadarScore ${Number(tool.radarScore).toFixed(0)}`,
    description: `${tool.name} AI tool analysis: RadarScore ${Number(tool.radarScore).toFixed(1)}, category ${tool.category}. Sub-scores across 5 dimensions.`,
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();

  const [tool] = await db.select().from(tools).where(eq(tools.id, slug)).limit(1);

  if (!tool) notFound();

  // Fetch score history
  const scoreHistory = await db
    .select({
      radarScore: scores.radarScore,
      weekOf: scores.weekOf,
      delta: scores.delta,
    })
    .from(scores)
    .where(eq(scores.toolId, slug))
    .orderBy(asc(scores.weekOf));

  const latestScore = scoreHistory[scoreHistory.length - 1];
  const subScores = (tool.subScores as SubScores) ?? {
    adoptionMomentum: 0,
    developerSentiment: 0,
    enterpriseReadiness: 0,
    recency: 0,
    buzz: 0,
  };

  // Fetch recent signals
  const recentSignals = await db
    .select({
      source: signals.source,
      rawData: signals.rawData,
      fetchedAt: signals.fetchedAt,
    })
    .from(signals)
    .where(eq(signals.toolId, slug))
    .orderBy(desc(signals.fetchedAt))
    .limit(6);

  // Fetch comparisons involving this tool
  const comparisonList = await db
    .select()
    .from(comparisons)
    .where(or(eq(comparisons.toolAId, slug), eq(comparisons.toolBId, slug)))
    .orderBy(desc(comparisons.weekOf))
    .limit(3);

  // Resolve comparison tool names
  const compToolIds = new Set<string>();
  for (const c of comparisonList) {
    compToolIds.add(c.toolAId === slug ? c.toolBId : c.toolAId);
  }
  const compTools = compToolIds.size
    ? await db
        .select({ id: tools.id, name: tools.name })
        .from(tools)
        .where(inArray(tools.id, Array.from(compToolIds)))
    : [];
  const compNameMap = new Map(compTools.map((t) => [t.id, t.name]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "AIApplication",
    url: tool.websiteUrl ?? undefined,
    description: tool.summary ?? `${tool.name} AI tool — RadarScore ${Number(tool.radarScore).toFixed(1)}`,
    ...(tool.pricingTier === "free"
      ? { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }
      : {}),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(tool.radarScore).toFixed(1),
      bestRating: "100",
      worstRating: "0",
      ratingCount: "1",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
        <ScoreBadge score={Number(tool.radarScore)} size="lg" showLabel />

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            <DeltaBadge delta={latestScore?.delta ? Number(latestScore.delta) : null} />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link
              href={`/category/${tool.category}`}
              className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary/30"
            >
              {tool.category}
            </Link>
            <span className="text-sm text-muted capitalize">{tool.pricingTier}</span>
            {tool.selfHostable && (
              <span className="text-sm text-secondary">✓ Self-hostable</span>
            )}
          </div>
          <div className="flex gap-3 mt-3">
            {tool.websiteUrl && (
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Website ↗
              </a>
            )}
            {tool.githubUrl && (
              <a
                href={tool.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                GitHub ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-2">Sub-Score Breakdown</h2>
          <RadarScoreChart subScores={subScores} toolName={tool.name} />
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {Object.entries(subScores).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="font-medium">{(value as number).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-2">Score History</h2>
          {scoreHistory && scoreHistory.length > 1 ? (
            <TrendChart
              data={scoreHistory.map((s) => ({
                weekOf: s.weekOf,
                radarScore: Number(s.radarScore),
              }))}
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted text-sm">
              Trend data will appear after 2+ pipeline runs.
            </div>
          )}
        </div>
      </div>

      {/* Signal Sources */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Latest Signals</h2>
        {recentSignals && recentSignals.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentSignals.map((signal, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">
                    {signal.source}
                  </span>
                  <span className="text-xs text-muted">
                    {signal.fetchedAt ? new Date(signal.fetchedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <pre className="text-xs text-muted overflow-auto max-h-32">
                  {JSON.stringify(signal.rawData, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">
            No signals collected yet. Data appears after the first pipeline run.
          </p>
        )}
      </section>

      {/* Comparisons */}
      {comparisonList && comparisonList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Comparisons</h2>
          <div className="space-y-3">
            {comparisonList.map((c) => {
              const otherId = c.toolAId === slug ? c.toolBId : c.toolAId;
              const otherName = compNameMap.get(otherId) ?? otherId;
              return (
                <Link
                  key={c.id}
                  href={`/compare?a=${slug}&b=${otherId}`}
                  className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    {tool.name} vs {otherName}
                  </div>
                  <p className="text-sm text-muted">{c.comparisonBlurb}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
