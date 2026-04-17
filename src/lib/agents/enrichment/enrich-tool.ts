import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { tools, comparisons } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";

/**
 * Generate AI-powered comparison blurbs for top tool pairs.
 * Called after all tools are scored for the week.
 */
export async function enrichComparisons(weekOf: string) {
  if (!process.env.ANTHROPIC_API_KEY) return;

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
    })
    .from(tools)
    .orderBy(desc(tools.radarScore))
    .limit(10);

  if (topTools.length < 2) return;

  // Generate comparisons for adjacent pairs (1v2, 2v3, ... + 1v3 cross-category)
  const pairs: [typeof topTools[0], typeof topTools[0]][] = [];
  for (let i = 0; i < Math.min(topTools.length - 1, 5); i++) {
    pairs.push([topTools[i], topTools[i + 1]]);
  }
  // Cross-category pair: #1 vs first tool in different category
  const firstCategory = topTools[0].category;
  const crossTool = topTools.find((t) => t.category !== firstCategory);
  if (crossTool) {
    pairs.push([topTools[0], crossTool]);
  }

  for (const [toolA, toolB] of pairs) {
    // Check if comparison already exists for this week
    const existing = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(
        and(
          eq(comparisons.toolAId, toolA.id),
          eq(comparisons.toolBId, toolB.id),
          eq(comparisons.weekOf, weekOf)
        )
      )
      .limit(1);

    if (existing.length > 0) continue;

    try {
      const prompt = `Compare these two AI tools and generate a brief, objective comparison blurb (2-3 sentences) plus dimension scores.

Tool A: ${toolA.name} (Category: ${toolA.category}, RadarScore: ${toolA.radarScore})
Sub-scores A: ${JSON.stringify(toolA.subScores)}

Tool B: ${toolB.name} (Category: ${toolB.category}, RadarScore: ${toolB.radarScore})
Sub-scores B: ${JSON.stringify(toolB.subScores)}

Reply ONLY with a JSON object:
{
  "blurb": "2-3 sentence comparison",
  "dimensions": [
    {"dimension": "Performance", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Developer Experience", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Enterprise Readiness", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Community", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"},
    {"dimension": "Innovation", "toolAValue": 0-100, "toolBValue": 0-100, "winner": "a"|"b"|"tie"}
  ]
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text"
          ? response.content[0].text.trim()
          : "";

      if (!text.startsWith("{")) continue;
      const data = JSON.parse(text);

      await db.insert(comparisons).values({
        toolAId: toolA.id,
        toolBId: toolB.id,
        comparisonBlurb: data.blurb,
        dimensions: data.dimensions,
        generatedAt: new Date(),
        weekOf,
      });
    } catch {
      // Skip failed comparison, not critical
      continue;
    }
  }
}
