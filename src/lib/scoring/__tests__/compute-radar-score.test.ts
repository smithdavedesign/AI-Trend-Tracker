import { describe, it, expect } from "vitest";
import { computeRadarScore } from "../compute-radar-score";
import type { Signal } from "@/lib/schemas";

function makeSignal(
  source: Signal["source"],
  rawData: Record<string, unknown>
): Signal {
  return {
    toolId: "test-tool",
    source,
    rawData,
    fetchedAt: new Date().toISOString(),
  };
}

describe("computeRadarScore", () => {
  it("returns zeros when no signals provided", () => {
    const result = computeRadarScore([]);
    expect(result.radarScore).toBe(0);
    expect(result.adoptionMomentum).toBe(0);
    expect(result.developerSentiment).toBe(0);
    expect(result.enterpriseReadiness).toBe(0);
    expect(result.recency).toBe(0);
    expect(result.buzz).toBe(0);
  });

  it("computes score with full signal set", () => {
    const signals: Signal[] = [
      makeSignal("github", {
        stars: 25000,
        starsGrowth30d: 250,
        forks: 3000,
        openIssues: 150,
        lastReleaseDate: "2026-04-10T00:00:00Z",
        commitFrequency90d: 10,
      }),
      makeSignal("reddit", {
        postCount30d: 25,
        commentCount30d: 500,
        avgSentiment: 0.3,
        subredditsActive: ["MachineLearning", "LocalLLaMA"],
      }),
      makeSignal("hn", {
        frontPageHits30d: 2,
        totalPoints30d: 400,
        commentCount30d: 200,
        avgSentiment: 0.2,
      }),
      makeSignal("g2", {
        starRating: 4.2,
        reviewCount: 500,
        reviewGrowth30d: 20,
        satisfactionPct: 85,
      }),
      makeSignal("changelog", {
        releasesLast90d: 5,
        daysSinceLastRelease: 15,
        latestVersion: "2.1.0",
      }),
      makeSignal("arxiv", {
        paperCount: 50,
        recentPapers30d: 5,
      }),
    ];

    const result = computeRadarScore(signals);

    expect(result.radarScore).toBeGreaterThan(0);
    expect(result.radarScore).toBeLessThanOrEqual(100);
    expect(result.adoptionMomentum).toBeGreaterThan(0);
    expect(result.developerSentiment).toBeGreaterThan(0);
    expect(result.enterpriseReadiness).toBeGreaterThan(0);
    expect(result.recency).toBeGreaterThan(0);
    expect(result.buzz).toBeGreaterThan(0);
  });

  it("handles partial signals — missing GitHub", () => {
    const signals: Signal[] = [
      makeSignal("reddit", {
        postCount30d: 30,
        commentCount30d: 600,
        avgSentiment: 0.5,
        subredditsActive: ["MachineLearning"],
      }),
      makeSignal("hn", {
        frontPageHits30d: 3,
        totalPoints30d: 600,
        commentCount30d: 300,
        avgSentiment: 0.4,
      }),
    ];

    const result = computeRadarScore(signals);

    expect(result.radarScore).toBeGreaterThan(0);
    // No GitHub = no adoption score, no recency from commits, limited enterprise
    expect(result.adoptionMomentum).toBe(0);
    expect(result.developerSentiment).toBeGreaterThan(0);
    expect(result.buzz).toBeGreaterThan(0);
  });

  it("handles partial signals — missing Reddit and HN", () => {
    const signals: Signal[] = [
      makeSignal("github", {
        stars: 10000,
        starsGrowth30d: 100,
        forks: 1000,
        openIssues: 50,
        lastReleaseDate: "2026-04-01T00:00:00Z",
        commitFrequency90d: 15,
      }),
      makeSignal("changelog", {
        releasesLast90d: 8,
        daysSinceLastRelease: 5,
        latestVersion: "3.0.0",
      }),
    ];

    const result = computeRadarScore(signals);

    expect(result.radarScore).toBeGreaterThan(0);
    expect(result.adoptionMomentum).toBeGreaterThan(0);
    expect(result.recency).toBeGreaterThan(0);
    // No Reddit/HN = no sentiment, no buzz
    expect(result.developerSentiment).toBe(0);
    expect(result.buzz).toBe(0);
  });

  it("caps sub-scores at 100", () => {
    const signals: Signal[] = [
      makeSignal("github", {
        stars: 200000,
        starsGrowth30d: 5000,
        forks: 50000,
        openIssues: 1000,
        lastReleaseDate: "2026-04-15T00:00:00Z",
        commitFrequency90d: 100,
      }),
      makeSignal("g2", {
        starRating: 5,
        reviewCount: 5000,
        reviewGrowth30d: 200,
        satisfactionPct: 100,
      }),
      makeSignal("hn", {
        frontPageHits30d: 20,
        totalPoints30d: 5000,
        commentCount30d: 2000,
        avgSentiment: 1.0,
      }),
      makeSignal("reddit", {
        postCount30d: 200,
        commentCount30d: 5000,
        avgSentiment: 1.0,
        subredditsActive: ["MachineLearning", "LocalLLaMA", "ChatGPT"],
      }),
      makeSignal("changelog", {
        releasesLast90d: 30,
        daysSinceLastRelease: 0,
        latestVersion: "5.0.0",
      }),
      makeSignal("arxiv", {
        paperCount: 500,
        recentPapers30d: 100,
      }),
    ];

    const result = computeRadarScore(signals);

    expect(result.radarScore).toBeLessThanOrEqual(100);
    expect(result.adoptionMomentum).toBeLessThanOrEqual(100);
    expect(result.developerSentiment).toBeLessThanOrEqual(100);
    expect(result.enterpriseReadiness).toBeLessThanOrEqual(100);
    expect(result.recency).toBeLessThanOrEqual(100);
    expect(result.buzz).toBeLessThanOrEqual(100);
  });

  it("is deterministic — same input always produces same output", () => {
    const signals: Signal[] = [
      makeSignal("github", {
        stars: 15000,
        starsGrowth30d: 200,
        forks: 2000,
        openIssues: 100,
        lastReleaseDate: "2026-04-01T00:00:00Z",
        commitFrequency90d: 8,
      }),
      makeSignal("reddit", {
        postCount30d: 15,
        commentCount30d: 300,
        avgSentiment: 0.2,
        subredditsActive: ["MachineLearning"],
      }),
    ];

    const result1 = computeRadarScore(signals);
    const result2 = computeRadarScore(signals);

    expect(result1).toEqual(result2);
  });

  it("radar score is weighted average of sub-scores", () => {
    // With all 5 sub-scores available and equal weights (20% each),
    // radarScore should equal the simple average
    const signals: Signal[] = [
      makeSignal("github", {
        stars: 25000,
        starsGrowth30d: 250,
        forks: 3000,
        openIssues: 150,
        commitFrequency90d: 10,
      }),
      makeSignal("g2", {
        starRating: 4.0,
        reviewCount: 500,
        reviewGrowth30d: 25,
        satisfactionPct: 80,
      }),
      makeSignal("reddit", {
        postCount30d: 20,
        commentCount30d: 400,
        avgSentiment: 0.3,
        subredditsActive: ["MachineLearning"],
      }),
      makeSignal("hn", {
        frontPageHits30d: 2,
        totalPoints30d: 300,
        commentCount30d: 150,
        avgSentiment: 0.1,
      }),
      makeSignal("changelog", {
        releasesLast90d: 6,
        daysSinceLastRelease: 10,
        latestVersion: "2.0.0",
      }),
      makeSignal("arxiv", {
        paperCount: 30,
        recentPapers30d: 5,
      }),
    ];

    const result = computeRadarScore(signals);

    // With all sub-scores available, radarScore = average of sub-scores
    const expectedAvg =
      (result.adoptionMomentum +
        result.developerSentiment +
        result.enterpriseReadiness +
        result.recency +
        result.buzz) /
      5;

    expect(result.radarScore).toBeCloseTo(expectedAvg, 1);
  });
});
