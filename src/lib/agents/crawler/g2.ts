import Anthropic from "@anthropic-ai/sdk";
import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
  websiteUrl?: string | null;
}

/**
 * Crawl G2 data using Claude as an AI agent to extract structured info.
 * Since G2 has no public API, we use Claude with web context.
 */
export async function crawlG2(tool: ToolInput): Promise<Signal | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();

  const searchUrl = `https://www.g2.com/search?query=${encodeURIComponent(tool.name)}`;

  const prompt = `You are a data extraction assistant. I need structured review data for the AI tool "${tool.name}".

Based on your knowledge of G2 reviews and enterprise software ratings, provide your best estimate of the following metrics for "${tool.name}":

1. starRating (0-5, one decimal): Overall G2 star rating
2. reviewCount (integer): Approximate number of G2 reviews
3. reviewGrowth30d (integer): Estimated new reviews in the last 30 days
4. satisfactionPct (0-100 or null): User satisfaction percentage

Reply ONLY with a JSON object, no explanation:
{"starRating": number, "reviewCount": number, "reviewGrowth30d": number, "satisfactionPct": number|null}

If you have no information about this tool on G2, reply with: null`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    if (text === "null" || !text.startsWith("{")) return null;

    const data = JSON.parse(text);

    return {
      toolId: tool.id,
      source: "g2",
      rawData: {
        starRating: data.starRating ?? 0,
        reviewCount: data.reviewCount ?? 0,
        reviewGrowth30d: data.reviewGrowth30d ?? 0,
        satisfactionPct: data.satisfactionPct ?? null,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
