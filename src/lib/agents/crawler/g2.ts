import type { Signal } from "@/lib/schemas";

interface ToolInput {
  id: string;
  name: string;
  websiteUrl?: string | null;
}

function toG2Slug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

interface JsonLdNode {
  "@type"?: string;
  aggregateRating?: {
    ratingValue?: number | string;
    reviewCount?: number | string;
    bestRating?: number | string;
  };
  "@graph"?: JsonLdNode[];
}

function extractAggregateRating(jsonLd: JsonLdNode) {
  if (jsonLd.aggregateRating) return jsonLd.aggregateRating;
  if (Array.isArray(jsonLd["@graph"])) {
    for (const node of jsonLd["@graph"]) {
      if (node.aggregateRating) return node.aggregateRating;
    }
  }
  return null;
}

/**
 * Crawl G2 product review pages for real rating and review count data.
 * Extracts JSON-LD AggregateRating schema when available.
 * Returns null (rather than hallucinated data) if the page is unavailable.
 */
export async function crawlG2(tool: ToolInput): Promise<Signal | null> {
  const slug = toG2Slug(tool.name);
  const url = `https://www.g2.com/products/${slug}/reviews`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIRadar/1.0; +https://aidar.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract all JSON-LD blocks
    const jsonLdRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let match: RegExpExecArray | null;
    let rating = null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]) as JsonLdNode;
        rating = extractAggregateRating(parsed);
        if (rating) break;
      } catch {
        // malformed JSON-LD, skip
      }
    }

    if (!rating) return null;

    const starRating = Number(rating.ratingValue ?? 0);
    const reviewCount = Number(rating.reviewCount ?? 0);

    if (starRating === 0 && reviewCount === 0) return null;

    return {
      toolId: tool.id,
      source: "g2",
      rawData: {
        starRating,
        reviewCount,
        reviewGrowth30d: 0,
        satisfactionPct: starRating > 0 ? Math.round((starRating / 5) * 100) : null,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
