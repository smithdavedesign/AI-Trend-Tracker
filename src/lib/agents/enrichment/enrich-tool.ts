import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { tools, comparisons } from "@/lib/db/schema";
import { desc, eq, and, or } from "drizzle-orm";

/**
 * Generate AI-powered comparison blurbs for top tool pairs.
 * Called after all tools are scored for the week.
 */
export interface EnrichmentStats {
  claudeCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

// claude-sonnet-4-6 pricing (per million tokens)
const INPUT_COST_PER_M = 3;
const OUTPUT_COST_PER_M = 15;

export async function enrichComparisons(weekOf: string): Promise<EnrichmentStats> {
  const stats: EnrichmentStats = { claudeCalls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
  if (!process.env.ANTHROPIC_API_KEY) return stats;

  const client = new Anthropic();
  const db = getDb();

  // Get top 10 tools by radar_score
  const topTools = await db
    .select({
      id: tools.id,
      name: tools.name,
      category: tools.category,
      radarScore: tools.radarScore,
      subScores: tools.subScores,
      websiteUrl: tools.websiteUrl,
      githubUrl: tools.githubUrl,
    })
    .from(tools)
    .orderBy(desc(tools.radarScore))
    .limit(10);

  if (topTools.length < 2) return stats;

  // Adjacent pairs (1v2, 2v3, …) + one cross-category pair
  const pairs: [typeof topTools[0], typeof topTools[0]][] = [];
  for (let i = 0; i < Math.min(topTools.length - 1, 5); i++) {
    pairs.push([topTools[i], topTools[i + 1]]);
  }
  const firstCategory = topTools[0].category;
  const crossTool = topTools.find((t) => t.category !== firstCategory);
  if (crossTool) {
    pairs.push([topTools[0], crossTool]);
  }

  for (const [toolA, toolB] of pairs) {
    // Normalise pair order so (A,B) and (B,A) always produce the same DB key
    const [orderedA, orderedB] =
      toolA.id < toolB.id ? [toolA, toolB] : [toolB, toolA];

    const existing = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(
        and(
          or(
            and(eq(comparisons.toolAId, orderedA.id), eq(comparisons.toolBId, orderedB.id)),
            and(eq(comparisons.toolAId, orderedB.id), eq(comparisons.toolBId, orderedA.id))
          ),
          eq(comparisons.weekOf, weekOf)
        )
      )
      .limit(1);

    if (existing.length > 0) continue;

    try {
      const sourcesA = [toolA.websiteUrl, toolA.githubUrl].filter(Boolean).join(", ") || "no public URL";
      const sourcesB = [toolB.websiteUrl, toolB.githubUrl].filter(Boolean).join(", ") || "no public URL";

      const prompt = `You are an objective AI tool analyst. Compare these two tools based on the scoring data provided.

Tool A: ${orderedA.name} (Category: ${orderedA.category}, RadarScore: ${orderedA.radarScore})
Sources: ${sourcesA}
Sub-scores: ${JSON.stringify(orderedA.subScores)}

Tool B: ${orderedB.name} (Category: ${orderedB.category}, RadarScore: ${orderedB.radarScore})
Sources: ${sourcesB}
Sub-scores: ${JSON.stringify(orderedB.subScores)}

Reply ONLY with a JSON object, no markdown:
{
  "blurb": "2-3 sentence objective comparison grounded in the score data. Cite specific sub-score differences (e.g. 'Tool A leads on adoption momentum with X vs Y'). Do not speculate beyond the data.",
  "confidence": 0-100,
  "dimensions": [
    {"dimension": "Performance", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Developer Experience", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Enterprise Readiness", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Community", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Innovation", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"}
  ]
}

Set confidence lower (< 60) when the tools have similar scores across all dimensions and it's hard to distinguish a clear winner.`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });

      stats.claudeCalls++;
      stats.inputTokens += response.usage.input_tokens;
      stats.outputTokens += response.usage.output_tokens;

      const text =
        response.content[0].type === "text"
          ? response.content[0].text.trim()
          : "";

      if (!text.startsWith("{")) continue;

      const data = JSON.parse(text) as {
        blurb: string;
        confidence?: number;
        dimensions: unknown[];
      };

      const needsReview = (data.confidence ?? 100) < 60;

      await db.insert(comparisons).values({
        toolAId: orderedA.id,
        toolBId: orderedB.id,
        comparisonBlurb: data.blurb,
        dimensions: { items: data.dimensions, confidence: data.confidence ?? 100, needsReview },
        generatedAt: new Date(),
        weekOf,
      });
    } catch {
      continue;
    }
  }

  stats.estimatedCostUsd =
    Math.round(
      ((stats.inputTokens / 1_000_000) * INPUT_COST_PER_M +
        (stats.outputTokens / 1_000_000) * OUTPUT_COST_PER_M) *
        10_000
    ) / 10_000;

  return stats;
}
