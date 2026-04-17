import type { Signal } from "@/lib/schemas";

// ─── Types ───────────────────────────────────────────────

export interface RawSubScores {
  adoptionMomentum: number;
  developerSentiment: number;
  enterpriseReadiness: number;
  recency: number;
  buzz: number;
}

export interface ComputedScore {
  radarScore: number;
  adoptionMomentum: number;
  developerSentiment: number;
  enterpriseReadiness: number;
  recency: number;
  buzz: number;
}

// ─── Weights (v0: equal) ─────────────────────────────────

const WEIGHTS: Record<keyof RawSubScores, number> = {
  adoptionMomentum: 0.2,
  developerSentiment: 0.2,
  enterpriseReadiness: 0.2,
  recency: 0.2,
  buzz: 0.2,
};

// ─── Signal extraction helpers ───────────────────────────

function extractAdoptionMomentum(signals: Signal[]): number | null {
  const github = signals.find((s) => s.source === "github");
  const g2 = signals.find((s) => s.source === "g2");

  const values: number[] = [];

  if (github?.rawData) {
    const stars = github.rawData.starsGrowth30d;
    if (typeof stars === "number") {
      values.push(Math.min(100, (stars / 500) * 100));
    }
    const npmDownloads = github.rawData.npmWeeklyDownloads;
    if (typeof npmDownloads === "number") {
      // 0 = 0, 1M+ weekly downloads = 100
      values.push(Math.min(100, (npmDownloads / 1_000_000) * 100));
    }
  }

  if (g2?.rawData) {
    const growth = g2.rawData.reviewGrowth30d;
    if (typeof growth === "number") {
      // Normalize: 0 reviews = 0, 50+ new reviews = 100
      values.push(Math.min(100, (growth / 50) * 100));
    }
  }

  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

function extractDeveloperSentiment(signals: Signal[]): number | null {
  const reddit = signals.find((s) => s.source === "reddit");
  const hn = signals.find((s) => s.source === "hn");
  const g2 = signals.find((s) => s.source === "g2");

  const values: number[] = [];

  if (reddit?.rawData) {
    const sentiment = reddit.rawData.avgSentiment;
    if (typeof sentiment === "number") {
      // Normalize: -1..1 → 0..100
      values.push(((sentiment + 1) / 2) * 100);
    }
  }

  if (hn?.rawData) {
    const sentiment = hn.rawData.avgSentiment;
    if (typeof sentiment === "number") {
      values.push(((sentiment + 1) / 2) * 100);
    }
  }

  if (g2?.rawData) {
    const satisfaction = g2.rawData.satisfactionPct;
    if (typeof satisfaction === "number") {
      values.push(satisfaction);
    }
  }

  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

function extractEnterpriseReadiness(signals: Signal[]): number | null {
  // This is partially static (from tool metadata) and partially signal-derived
  // For signal-based scoring, we use G2 enterprise indicators and GitHub signals
  const g2 = signals.find((s) => s.source === "g2");
  const github = signals.find((s) => s.source === "github");

  let score = 0;
  let factors = 0;

  if (g2?.rawData) {
    const rating = g2.rawData.starRating;
    if (typeof rating === "number") {
      // G2 rating as enterprise trust signal: 0-5 → 0-100
      score += (rating / 5) * 100;
      factors++;
    }
    const reviewCount = g2.rawData.reviewCount;
    if (typeof reviewCount === "number") {
      // More reviews = more enterprise adoption: 0-1000+ → 0-100
      score += Math.min(100, (reviewCount / 1000) * 100);
      factors++;
    }
  }

  if (github?.rawData) {
    const stars = github.rawData.stars;
    if (typeof stars === "number") {
      // Stars as maturity signal: 0-50000+ → 0-100
      score += Math.min(100, (stars / 50000) * 100);
      factors++;
    }
  }

  return factors > 0 ? score / factors : null;
}

function extractRecency(signals: Signal[]): number | null {
  const github = signals.find((s) => s.source === "github");
  const changelog = signals.find((s) => s.source === "changelog");

  const values: number[] = [];

  if (changelog?.rawData) {
    const daysSince = changelog.rawData.daysSinceLastRelease;
    if (typeof daysSince === "number") {
      // 0 days = 100, 180+ days = 0
      values.push(Math.max(0, 100 - (daysSince / 180) * 100));
    }
    const releases = changelog.rawData.releasesLast90d;
    if (typeof releases === "number") {
      // 0 releases = 0, 10+ releases in 90d = 100
      values.push(Math.min(100, (releases / 10) * 100));
    }
  }

  if (github?.rawData) {
    const commitFreq = github.rawData.commitFrequency90d;
    if (typeof commitFreq === "number") {
      // 0 commits/week = 0, 20+ commits/week = 100
      values.push(Math.min(100, (commitFreq / 20) * 100));
    }
  }

  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

function extractBuzz(signals: Signal[]): number | null {
  const hn = signals.find((s) => s.source === "hn");
  const reddit = signals.find((s) => s.source === "reddit");
  const arxiv = signals.find((s) => s.source === "arxiv");

  const values: number[] = [];

  if (hn?.rawData) {
    const hits = hn.rawData.frontPageHits30d;
    if (typeof hits === "number") {
      // 0 hits = 0, 5+ front page hits = 100
      values.push(Math.min(100, (hits / 5) * 100));
    }
    const points = hn.rawData.totalPoints30d;
    if (typeof points === "number") {
      // 0 points = 0, 1000+ = 100
      values.push(Math.min(100, (points / 1000) * 100));
    }
  }

  if (reddit?.rawData) {
    const posts = reddit.rawData.postCount30d;
    if (typeof posts === "number") {
      // 0 posts = 0, 50+ posts = 100
      values.push(Math.min(100, (posts / 50) * 100));
    }
  }

  if (arxiv?.rawData) {
    const papers = arxiv.rawData.recentPapers30d;
    if (typeof papers === "number") {
      // 0 papers = 0, 20+ = 100
      values.push(Math.min(100, (papers / 20) * 100));
    }
  }

  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

// ─── Main scoring function ───────────────────────────────

export function computeRadarScore(signals: Signal[]): ComputedScore {
  const raw: Record<keyof RawSubScores, number | null> = {
    adoptionMomentum: extractAdoptionMomentum(signals),
    developerSentiment: extractDeveloperSentiment(signals),
    enterpriseReadiness: extractEnterpriseReadiness(signals),
    recency: extractRecency(signals),
    buzz: extractBuzz(signals),
  };

  // Collect available scores and redistribute weights for missing ones
  const available: { key: keyof RawSubScores; value: number }[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value !== null) {
      available.push({ key: key as keyof RawSubScores, value });
    }
  }

  // If no signals at all, return zeros
  if (available.length === 0) {
    return {
      radarScore: 0,
      adoptionMomentum: 0,
      developerSentiment: 0,
      enterpriseReadiness: 0,
      recency: 0,
      buzz: 0,
    };
  }

  // Redistribute weights: missing sub-scores give their weight to available ones
  const totalAvailableWeight = available.reduce(
    (sum, { key }) => sum + WEIGHTS[key],
    0
  );
  const weightMultiplier = 1 / totalAvailableWeight;

  let radarScore = 0;
  const subScores: Partial<Record<keyof RawSubScores, number>> = {};

  for (const { key, value } of available) {
    const clampedValue = Math.max(0, Math.min(100, Math.round(value * 100) / 100));
    subScores[key] = clampedValue;
    radarScore += clampedValue * WEIGHTS[key] * weightMultiplier;
  }

  // Fill missing sub-scores with 0
  const result: ComputedScore = {
    radarScore: Math.round(radarScore * 100) / 100,
    adoptionMomentum: subScores.adoptionMomentum ?? 0,
    developerSentiment: subScores.developerSentiment ?? 0,
    enterpriseReadiness: subScores.enterpriseReadiness ?? 0,
    recency: subScores.recency ?? 0,
    buzz: subScores.buzz ?? 0,
  };

  return result;
}
