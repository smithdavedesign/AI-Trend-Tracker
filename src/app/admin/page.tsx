import { getDb } from "@/lib/db";
import { tools, signals, digestSubscribers, pipelineRuns } from "@/lib/db/schema";
import { desc, gte, isNull, count } from "drizzle-orm";
import Link from "next/link";
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
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ value: signalCount }] = await db
    .select({ value: count() })
    .from(signals)
    .where(gte(signals.fetchedAt, new Date(weekAgo)));

  // Subscriber count
  const [{ value: subscriberCount }] = await db
    .select({ value: count() })
    .from(digestSubscribers)
    .where(isNull(digestSubscribers.unsubscribedAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted">Pipeline status and platform metrics.</p>
        </div>
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          ← Back to site
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Tools" value={toolCount} />
        <StatCard label="Signals (7d)" value={signalCount} />
        <StatCard label="Subscribers" value={subscriberCount} />
        <StatCard
          label="Last Run"
          value={
            runs[0]
              ? new Date(runs[0].startedAt).toLocaleDateString()
              : "Never"
          }
        />
      </div>

      {/* Pipeline Runs */}
      <section>
        <h2 className="text-xl font-bold mb-4">Pipeline Runs</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left p-3 font-medium">Started</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Tools</th>
                <th className="text-right p-3 font-medium">Duration</th>
                <th className="text-right p-3 font-medium">Errors</th>
              </tr>
            </thead>
            <tbody>
              {runs && runs.length > 0 ? (
                runs.map((run) => {
                  const duration = run.completedAt
                    ? Math.round(
                        (new Date(run.completedAt).getTime() -
                          new Date(run.startedAt).getTime()) /
                          1000
                      )
                    : null;

                  const errorCount = Array.isArray(run.errors)
                    ? run.errors.length
                    : 0;

                  return (
                    <tr
                      key={run.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="p-3 text-right">{run.toolsProcessed}</td>
                      <td className="p-3 text-right">
                        {duration !== null ? `${duration}s` : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {errorCount > 0 ? (
                          <span className="text-danger font-medium">
                            {errorCount}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted"
                  >
                    No pipeline runs yet. The first run happens Monday 6AM UTC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            {`curl -X POST http://localhost:8288/e/aidar \\
  -H "Content-Type: application/json" \\
  -d '{"name": "aidar/weekly-pipeline", "data": {}}'`}
          </code>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-secondary/10 text-secondary",
    running: "bg-accent/10 text-accent",
    failed: "bg-danger/10 text-danger",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-stone-100 text-stone-700"}`}
    >
      {status}
    </span>
  );
}
