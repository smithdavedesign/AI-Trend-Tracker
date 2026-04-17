import { inngest } from "../client";
import { getDb } from "@/lib/db";
import {
  tools,
  signals as signalsTable,
  scores,
  pipelineRuns,
} from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { computeRadarScore } from "@/lib/scoring/compute-radar-score";
import { withRetry } from "@/lib/utils/retry";
import type { Signal } from "@/lib/schemas";

const DEAD_TOOL_INACTIVITY_DAYS = 90;

function currentWeekOf(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1); // Monday
  return d.toISOString().slice(0, 10);
}

export const weeklyPipeline = inngest.createFunction(
  {
    id: "weekly-pipeline",
    retries: 2,
    triggers: [{ cron: "0 6 * * 1" }],
  },
  async ({ step }) => {
    const weekOf = currentWeekOf();
    const db = getDb();

    // Step 1: Create pipeline run record
    const runId = await step.run("create-pipeline-run", async () => {
      const [row] = await db
        .insert(pipelineRuns)
        .values({
          startedAt: new Date(),
          status: "running",
          toolsProcessed: 0,
          runType: "full",
        })
        .returning({ id: pipelineRuns.id });

      return row.id;
    });

    // Step 2: Fetch all tools
    const allTools = await step.run("fetch-tools", async () => {
      return db
        .select({
          id: tools.id,
          name: tools.name,
          category: tools.category,
          githubUrl: tools.githubUrl,
          websiteUrl: tools.websiteUrl,
          npmPackage: tools.npmPackage,
        })
        .from(tools)
        .orderBy(tools.name);
    });

    // Step 3: Tiered selection — top 50 weekly, rest monthly
    const toolIds = await step.run("determine-tools-to-update", async () => {
      const latestScores = await db
        .select({ toolId: scores.toolId, radarScore: scores.radarScore })
        .from(scores)
        .orderBy(desc(scores.radarScore));

      if (latestScores.length === 0) {
        return allTools.map((t) => t.id);
      }

      const weekNum = Math.floor(
        (Date.now() - new Date("2025-01-06").getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const isMonthlyWeek = weekNum % 4 === 0;

      const seen = new Set<string>();
      const ranked: string[] = [];
      for (const s of latestScores) {
        if (!seen.has(s.toolId)) {
          seen.add(s.toolId);
          ranked.push(s.toolId);
        }
      }

      const top50 = new Set(ranked.slice(0, 50));
      return allTools
        .filter((t) => top50.has(t.id) || isMonthlyWeek)
        .map((t) => t.id);
    });

    // Step 4–6: Crawl → store signals → score each tool
    const errors: Array<{ toolId: string; source: string; error: string }> = [];
    let toolsProcessed = 0;

    for (const toolId of toolIds) {
      const tool = allTools.find((t) => t.id === toolId);
      if (!tool) continue;

      const signals = await step.run(`crawl-${toolId}`, async () => {
        const collected: Signal[] = [];

        const { crawlGitHub } = await import("@/lib/agents/crawler/github");
        const { crawlReddit } = await import("@/lib/agents/crawler/reddit");
        const { crawlHackerNews } = await import("@/lib/agents/crawler/hn");
        const { crawlArXiv } = await import("@/lib/agents/crawler/arxiv");
        const { crawlG2 } = await import("@/lib/agents/crawler/g2");
        const { crawlChangelog } = await import("@/lib/agents/crawler/changelog");
        const { crawlProductHunt } = await import("@/lib/agents/crawler/ph");

        const crawlers = [
          { name: "github", fn: () => crawlGitHub(tool) },
          { name: "reddit", fn: () => crawlReddit(tool) },
          { name: "hn", fn: () => crawlHackerNews(tool) },
          { name: "arxiv", fn: () => crawlArXiv(tool) },
          { name: "g2", fn: () => crawlG2(tool) },
          { name: "changelog", fn: () => crawlChangelog(tool) },
          { name: "ph", fn: () => crawlProductHunt(tool) },
        ];

        const results = await Promise.allSettled(
          crawlers.map(async (c) => {
            try {
              return await withRetry(() => c.fn(), 3, 1000);
            } catch (err) {
              errors.push({
                toolId,
                source: c.name,
                error: err instanceof Error ? err.message : String(err),
              });
              return null;
            }
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            collected.push(result.value);
          }
        }

        return collected;
      });

      await step.run(`store-signals-${toolId}`, async () => {
        if (signals.length === 0) return;
        await db.insert(signalsTable).values(
          signals.map((s) => ({
            toolId: s.toolId,
            source: s.source,
            rawData: s.rawData,
            fetchedAt: new Date(s.fetchedAt),
          }))
        );
      });

      await step.run(`score-${toolId}`, async () => {
        const computed = computeRadarScore(signals);

        const [prev] = await db
          .select({ radarScore: scores.radarScore })
          .from(scores)
          .where(eq(scores.toolId, toolId))
          .orderBy(desc(scores.weekOf))
          .limit(1);

        const previousScore = prev ? Number(prev.radarScore) : null;
        const delta =
          previousScore === null
            ? null
            : Math.round((computed.radarScore - previousScore) * 100) / 100;

        await db.insert(scores).values({
          toolId,
          radarScore: String(computed.radarScore),
          adoptionMomentum: String(computed.adoptionMomentum),
          developerSentiment: String(computed.developerSentiment),
          enterpriseReadiness: String(computed.enterpriseReadiness),
          recency: String(computed.recency),
          buzz: String(computed.buzz),
          weekOf,
          previousRadarScore: previousScore === null ? null : String(previousScore),
          delta: delta === null ? null : String(delta),
        });

        await db
          .update(tools)
          .set({
            radarScore: String(computed.radarScore),
            subScores: {
              adoptionMomentum: computed.adoptionMomentum,
              developerSentiment: computed.developerSentiment,
              enterpriseReadiness: computed.enterpriseReadiness,
              recency: computed.recency,
              buzz: computed.buzz,
            },
            lastUpdated: new Date(),
          })
          .where(eq(tools.id, toolId));
      });

      toolsProcessed++;
    }

    // Step 7: Anomaly detection — flag suspicious score spikes
    await step.run("detect-anomalies", async () => {
      const HISTORY_WEEKS = 8;
      const ANOMALY_THRESHOLD = 2; // standard deviations

      for (const toolId of toolIds) {
        const history = await db
          .select({ delta: scores.delta, radarScore: scores.radarScore })
          .from(scores)
          .where(eq(scores.toolId, toolId))
          .orderBy(desc(scores.weekOf))
          .limit(HISTORY_WEEKS);

        if (history.length < 4) continue;

        const deltas = history
          .map((h) => (h.delta === null ? null : Number(h.delta)))
          .filter((d): d is number => d !== null);

        if (deltas.length < 3) continue;

        const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const variance = deltas.reduce((a, b) => a + (b - mean) ** 2, 0) / deltas.length;
        const stddev = Math.sqrt(variance);

        const currentDelta = deltas[0];
        if (stddev > 0 && Math.abs(currentDelta - mean) > ANOMALY_THRESHOLD * stddev) {
          const tool = allTools.find((t) => t.id === toolId);
          errors.push({
            toolId,
            source: "anomaly-detection",
            error: `Anomalous delta ${currentDelta.toFixed(1)} for ${tool?.name ?? toolId} (mean ${mean.toFixed(1)}, stddev ${stddev.toFixed(1)})`,
          });
        }
      }
    });

    // Step 8: Dead tool detection — flag tools with 90+ days of inactivity
    await step.run("detect-dead-tools", async () => {
      const cutoff = new Date(Date.now() - DEAD_TOOL_INACTIVITY_DAYS * 24 * 60 * 60 * 1000);

      // Only check tools not already flagged as dead
      const liveTools = await db
        .select({ id: tools.id, name: tools.name })
        .from(tools)
        .where(and(eq(tools.isDead, false), isNull(tools.deadSince)));

      const flagged: string[] = [];

      for (const tool of liveTools) {
        // Get most recent GitHub signal for this tool
        const [latest] = await db
          .select({ rawData: signalsTable.rawData, fetchedAt: signalsTable.fetchedAt })
          .from(signalsTable)
          .where(and(eq(signalsTable.toolId, tool.id), eq(signalsTable.source, "github")))
          .orderBy(desc(signalsTable.fetchedAt))
          .limit(1);

        if (!latest) continue;

        const raw = latest.rawData as {
          lastReleaseDate?: string | null;
          commitFrequency90d?: number;
        };

        const noRelease =
          !raw.lastReleaseDate ||
          new Date(raw.lastReleaseDate) < cutoff;
        const noCommits = (raw.commitFrequency90d ?? 1) === 0;

        if (noRelease && noCommits) {
          await db
            .update(tools)
            .set({ isDead: true, deadSince: new Date() })
            .where(eq(tools.id, tool.id));
          flagged.push(tool.name);
        }
      }

      return { flagged };
    });

    // Step 8: Generate comparisons for top tools
    await step.run("generate-comparisons", async () => {
      const { enrichComparisons } = await import("@/lib/agents/enrichment/enrich-tool");
      await enrichComparisons(weekOf);
    });

    // Step 9: Trigger ISR revalidation
    await step.run("revalidate-pages", async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const secret = process.env.REVALIDATION_SECRET;
      if (!secret) return;
      await fetch(`${baseUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`);
    });

    // Step 10: Send weekly digest
    await step.run("send-digest", async () => {
      const { sendWeeklyDigest } = await import("@/lib/digest/send-digest");
      await sendWeeklyDigest(weekOf);
    });

    // Step 11: Mark pipeline complete
    await step.run("finalize-pipeline-run", async () => {
      await db
        .update(pipelineRuns)
        .set({
          completedAt: new Date(),
          status: "completed",
          toolsProcessed,
          errors: errors.length > 0 ? errors : null,
        })
        .where(eq(pipelineRuns.id, runId));
    });

    return { runId, toolsProcessed, errors: errors.length, weekOf };
  }
);
