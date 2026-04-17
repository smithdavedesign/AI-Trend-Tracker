import { getDb } from "@/lib/db";
import { tools, signals, digestSubscribers, pipelineRuns, comparisons } from "@/lib/db/schema";
import { desc, gte, isNull, count, eq, asc } from "drizzle-orm";
import Link from "next/link";
import { DeadToolRow } from "./dead-tool-row";
import { ScoreOverridePanel } from "./score-override";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = getDb();

  // Pipeline runs
  const runs = await db
    .select()
    .from(pipelineRuns)
    .orderBy(desc(pipelineRuns.startedAt))
    .limit(10);

  // Tool count
  const [{ value: toolCount }] = await db.select({ value: count() }).from(tools);

  // Signal count (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [{ value: signalCount }] = await db
    .select({ value: count() })
    .from(signals)
    .where(gte(signals.fetchedAt, weekAgo));

  // Subscriber count
  const [{ value: subscriberCount }] = await db
    .select({ value: count() })
    .from(digestSubscribers)
    .where(isNull(digestSubscribers.unsubscribedAt));

  // Dead tools
  const deadTools = await db
    .select({ id: tools.id, name: tools.name, category: tools.category, deadSince: tools.deadSince })
    .from(tools)
    .where(eq(tools.isDead, true))
    .orderBy(desc(tools.deadSince));

  // All tools for override picker
  const allTools = await db
    .select({ id: tools.id, name: tools.name })
    .from(tools)
    .orderBy(asc(tools.name));

  // Recent comparisons for review queue (last 5)
  const recentComparisons = await db
    .select({
      id: comparisons.id,
      toolAId: comparisons.toolAId,
      toolBId: comparisons.toolBId,
      comparisonBlurb: comparisons.comparisonBlurb,
      dimensions: comparisons.dimensions,
      weekOf: comparisons.weekOf,
    })
    .from(comparisons)
    .orderBy(desc(comparisons.generatedAt))
    .limit(5);

  // Anomaly alerts from the most recent run
  const latestRun = runs[0];
  const anomalies = Array.isArray(latestRun?.errors)
    ? (latestRun.errors as Array<{ source: string; error: string; toolId: string }>)
        .filter((e) => e.source === "anomaly-detection")
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted">Pipeline status and platform metrics.</p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to site
        </Link>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="mb-8 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <h2 className="font-semibold text-accent mb-2">Score Anomalies Detected</h2>
          <ul className="space-y-1">
            {anomalies.map((a) => (
              <li key={`${a.toolId}-${a.source}`} className="text-sm text-foreground">{a.error}</li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-2">From last pipeline run · Review scores below if unexpected</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Tools" value={toolCount} />
        <StatCard label="Signals (7d)" value={signalCount} />
        <StatCard label="Subscribers" value={subscriberCount} />
        <StatCard
          label="Last Run"
          value={runs[0] ? new Date(runs[0].startedAt).toLocaleDateString() : "Never"}
        />
      </div>

      {/* Pipeline Runs */}
      <section>
        <h2 className="text-xl font-bold mb-4">Pipeline Runs</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="sticky left-0 z-10 bg-background text-left p-3 font-medium whitespace-nowrap">Started</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Tools</th>
                  <th className="text-right p-3 font-medium">Duration</th>
                  <th className="text-right p-3 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {runs.length > 0 ? (
                  runs.map((run) => {
                    const duration = run.completedAt
                      ? Math.round(
                          (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
                        )
                      : null;
                    const allErrors = Array.isArray(run.errors) ? run.errors as Array<{ source: string }> : [];
                    const crawlErrors = allErrors.filter((e) => e.source !== "anomaly-detection");
                    const hasAnomalies = allErrors.some((e) => e.source === "anomaly-detection");

                    return (
                      <tr key={run.id} className="border-b border-border last:border-0">
                        <td className="sticky left-0 z-10 bg-card p-3 whitespace-nowrap">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                        <td className="p-3"><StatusBadge status={run.status} /></td>
                        <td className="p-3 text-right">{run.toolsProcessed}</td>
                        <td className="p-3 text-right">{duration === null ? "—" : `${duration}s`}</td>
                        <td className="p-3 text-right">
                          <span className="flex items-center justify-end gap-2">
                            {crawlErrors.length > 0 && (
                              <span className="text-danger font-medium">{crawlErrors.length} err</span>
                            )}
                            {hasAnomalies && (
                              <span className="text-accent font-medium">anomaly</span>
                            )}
                            {crawlErrors.length === 0 && !hasAnomalies && (
                              <span className="text-muted">—</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      No pipeline runs yet. The first run happens Monday 6AM UTC.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Review Queue */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Comparison Review Queue</h2>
        <div className="space-y-3">
          {recentComparisons.length === 0 ? (
            <p className="text-sm text-muted">No comparisons generated yet.</p>
          ) : (
            recentComparisons.map((c) => {
              const dims = c.dimensions as { needsReview?: boolean; confidence?: number } | null;
              const flagged = dims?.needsReview === true;
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border p-4 text-sm ${flagged ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {c.toolAId} vs {c.toolBId}
                      {flagged && <span className="ml-2 text-xs text-accent font-normal">low confidence</span>}
                    </span>
                    <span className="text-xs text-muted">Week of {c.weekOf}</span>
                  </div>
                  <p className="text-muted line-clamp-2">{c.comparisonBlurb}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Dead Tools */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Dead Tools ({deadTools.length})</h2>
        {deadTools.length === 0 ? (
          <p className="text-sm text-muted">No tools currently flagged as dead.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left p-3 font-medium">Tool</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Dead Since</th>
                  <th className="text-right p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {deadTools.map((tool) => (
                  <DeadToolRow key={tool.id} tool={tool} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Manual Score Override */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Manual Score Override</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted mb-4">
            Override sub-scores for a tool. RadarScore is recalculated as the equal-weighted average.
          </p>
          <ScoreOverridePanel tools={allTools} />
        </div>
      </section>

      {/* Manual trigger info */}
      <section className="mt-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-2">Manual Pipeline Trigger</h3>
          <p className="text-sm text-muted mb-3">
            Send an event to Inngest to trigger a pipeline run manually:
          </p>
          <code className="block text-xs bg-background rounded-lg p-3 overflow-auto">
            {String.raw`curl -X POST http://localhost:8288/e/aidar \
  -H "Content-Type: application/json" \
  -d '{"name": "aidar/weekly-pipeline", "data": {}}'`}
          </code>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const styles: Record<string, string> = {
    completed: "bg-secondary/10 text-secondary",
    running:   "bg-accent/10 text-accent",
    failed:    "bg-danger/10 text-danger",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-stone-100 text-stone-700"}`}>
      {status}
    </span>
  );
}
