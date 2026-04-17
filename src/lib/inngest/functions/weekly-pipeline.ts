import { inngest } from "../client";
import { getDb } from "@/lib/db";
import {
  tools,
  signals as signalsTable,
  scores,
  pipelineRuns,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { computeRadarScore } from "@/lib/scoring/compute-radar-score";
import type { Signal } from "@/lib/schemas";

function currentWeekOf(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1); // Monday
  return d.toISOString().slice(0, 10);
}

/**
 * Weekly pipeline — triggered every Monday 6am UTC.
 *
 * Steps:
 * 1. Log pipeline_run start
 * 2. Fetch tool list
 * 3. For each tool: crawl → score → store
 * 4. Generate comparisons
 * 5. Revalidate ISR pages
 * 6. Send digest
 * 7. Mark pipeline_run complete
 */
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
        })
        .from(tools)
        .orderBy(tools.name);
    });

    // Apply tiered update logic: top 50 by score get weekly, rest monthly
    const toolIds = await step.run("determine-tools-to-update", async () => {
      const latestScores = await db
        .select({
          toolId: scores.toolId,
          radarScore: scores.radarScore,
        })
        .from(scores)
        .orderBy(desc(scores.radarScore));

      // First run: process all tools if no scores exist yet
      if (latestScores.length === 0) {
        return allTools.map((t) => t.id);
      }

      // Get week number to decide monthly tools
      const weekNum = Math.floor(
        (new Date().getTime() - new Date("2025-01-06").getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const isMonthlyWeek = weekNum % 4 === 0;

      // Deduplicate to latest per tool, grab top 50
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

    // Step 3: Crawl each tool — each source as a sub-step for resilience
    const errors: Array<{ toolId: string; source: string; error: string }> = [];
    let toolsProcessed = 0;

    for (const toolId of toolIds) {
      const tool = allTools.find((t) => t.id === toolId);
      if (!tool) continue;

      const signals = await step.run(`crawl-${toolId}`, async () => {
        const collected: Signal[] = [];

        // Import crawlers dynamically to avoid cold-start loading everything
        const { crawlGitHub } = await import("@/lib/agents/crawler/github");
        const { crawlReddit } = await import("@/lib/agents/crawler/reddit");
        const { crawlHackerNews } = await import("@/lib/agents/crawler/hn");
        const { crawlArXiv } = await import("@/lib/agents/crawler/arxiv");
        const { crawlG2 } = await import("@/lib/agents/crawler/g2");
        const { crawlChangelog } = await import("@/lib/agents/crawler/changelog");

        const crawlers = [
          { name: "github", fn: () => crawlGitHub(tool) },
          { name: "reddit", fn: () => crawlReddit(tool) },
          { name: "hn", fn: () => crawlHackerNews(tool) },
          { name: "arxiv", fn: () => crawlArXiv(tool) },
          { name: "g2", fn: () => crawlG2(tool) },
          { name: "changelog", fn: () => crawlChangelog(tool) },
        ];

        const results = await Promise.allSettled(
          crawlers.map(async (c) => {
            try {
              return await c.fn();
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

      // Step 4: Store signals
      await step.run(`store-signals-${toolId}`, async () => {
        if (signals.length === 0) return;

        const rows = signals.map((s) => ({
          toolId: s.toolId,
          source: s.source,
          rawData: s.rawData,
          fetchedAt: new Date(s.fetchedAt),
        }));

        await db.insert(signalsTable).values(rows);
      });

      // Step 5: Compute and store score
      await step.run(`score-${toolId}`, async () => {
        const computed = computeRadarScore(signals);

        // Get previous score for delta
        const [prev] = await db
          .select({ radarScore: scores.radarScore })
          .from(scores)
          .where(eq(scores.toolId, toolId))
          .orderBy(desc(scores.weekOf))
          .limit(1);

        const previousScore = prev ? Number(prev.radarScore) : null;
        const delta =
          previousScore !== null
            ? Math.round((computed.radarScore - previousScore) * 100) / 100
            : null;

        await db.insert(scores).values({
          toolId,
          radarScore: String(computed.radarScore),
          adoptionMomentum: String(computed.adoptionMomentum),
          developerSentiment: String(computed.developerSentiment),
          enterpriseReadiness: String(computed.enterpriseReadiness),
          recency: String(computed.recency),
          buzz: String(computed.buzz),
          weekOf,
          previousRadarScore: previousScore !== null ? String(previousScore) : null,
          delta: delta !== null ? String(delta) : null,
        });

        // Update tool record with latest score
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

    // Step 6: Generate comparisons for top tools
    await step.run("generate-comparisons", async () => {
      const { enrichComparisons } = await import(
        "@/lib/agents/enrichment/enrich-tool"
      );
      await enrichComparisons(weekOf);
    });

    // Step 7: Trigger ISR revalidation
    await step.run("revalidate-pages", async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const secret = process.env.REVALIDATION_SECRET;
      if (!secret) return;

      await fetch(
        `${baseUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`
      );
    });

    // Step 8: Send weekly digest
    await step.run("send-digest", async () => {
      const { sendWeeklyDigest } = await import("@/lib/digest/send-digest");
      await sendWeeklyDigest(weekOf);
    });

    // Step 9: Mark pipeline complete
    await step.run("finalize-pipeline-run", async () => {
      await db
        .update(pipelineRuns)
        .set({
          completedAt: new Date(),
          status: errors.length > 0 ? "completed" : "completed",
          toolsProcessed,
          errors: errors.length > 0 ? errors : null,
        })
        .where(eq(pipelineRuns.id, runId));
    });

    return {
      runId,
      toolsProcessed,
      errors: errors.length,
      weekOf,
    };
  }
);
