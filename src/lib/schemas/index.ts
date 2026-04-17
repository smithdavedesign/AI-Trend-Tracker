import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────

export const CategoryEnum = z.enum([
  "llm",
  "coding",
  "agents",
  "infra",
  "vertical",
]);
export type Category = z.infer<typeof CategoryEnum>;

export const PricingTierEnum = z.enum([
  "free",
  "freemium",
  "paid",
  "enterprise",
]);
export type PricingTier = z.infer<typeof PricingTierEnum>;

export const SignalSourceEnum = z.enum([
  "github",
  "reddit",
  "hn",
  "arxiv",
  "g2",
  "ph",
  "changelog",
]);
export type SignalSource = z.infer<typeof SignalSourceEnum>;

export const PipelineStatusEnum = z.enum([
  "running",
  "completed",
  "failed",
]);
export type PipelineStatus = z.infer<typeof PipelineStatusEnum>;

export const RunTypeEnum = z.enum(["full", "incremental"]);
export type RunType = z.infer<typeof RunTypeEnum>;

// ─── Sub-scores ──────────────────────────────────────────

export const SubScoresSchema = z.object({
  adoptionMomentum: z.number().min(0).max(100),
  developerSentiment: z.number().min(0).max(100),
  enterpriseReadiness: z.number().min(0).max(100),
  recency: z.number().min(0).max(100),
  buzz: z.number().min(0).max(100),
});
export type SubScores = z.infer<typeof SubScoresSchema>;

// ─── Tool (matches PRD acceptance test schema) ───────────

export const ToolSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: CategoryEnum,
  radarScore: z.number().min(0).max(100),
  subScores: SubScoresSchema,
  pricingTier: PricingTierEnum,
  selfHostable: z.boolean(),
  lastUpdated: z.string().datetime(),
  signalSources: z.array(z.string()),
});
export type Tool = z.infer<typeof ToolSchema>;

// ─── Signal (raw data from a single source) ──────────────

export const SignalSchema = z.object({
  id: z.string().uuid().optional(),
  toolId: z.string(),
  source: SignalSourceEnum,
  rawData: z.record(z.string(), z.unknown()),
  fetchedAt: z.string().datetime(),
});
export type Signal = z.infer<typeof SignalSchema>;

// ─── GitHub signal data ──────────────────────────────────

export const GitHubSignalData = z.object({
  stars: z.number().int().min(0),
  starsGrowth30d: z.number(), // stars gained in last 30 days
  forks: z.number().int().min(0),
  openIssues: z.number().int().min(0),
  lastReleaseDate: z.string().nullable(),
  commitFrequency90d: z.number().min(0), // commits per week over 90 days
});
export type GitHubSignalDataType = z.infer<typeof GitHubSignalData>;

// ─── Reddit signal data ──────────────────────────────────

export const RedditSignalData = z.object({
  postCount30d: z.number().int().min(0),
  commentCount30d: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1), // -1 negative, 0 neutral, 1 positive
  subredditsActive: z.array(z.string()),
});
export type RedditSignalDataType = z.infer<typeof RedditSignalData>;

// ─── HN signal data ─────────────────────────────────────

export const HNSignalData = z.object({
  frontPageHits30d: z.number().int().min(0),
  totalPoints30d: z.number().int().min(0),
  commentCount30d: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1),
});
export type HNSignalDataType = z.infer<typeof HNSignalData>;

// ─── ArXiv signal data ──────────────────────────────────

export const ArXivSignalData = z.object({
  paperCount: z.number().int().min(0),
  recentPapers30d: z.number().int().min(0),
});
export type ArXivSignalDataType = z.infer<typeof ArXivSignalData>;

// ─── G2 signal data ─────────────────────────────────────

export const G2SignalData = z.object({
  starRating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  reviewGrowth30d: z.number().int().min(0),
  satisfactionPct: z.number().min(0).max(100).nullable(),
});
export type G2SignalDataType = z.infer<typeof G2SignalData>;

// ─── Changelog signal data ──────────────────────────────

export const ChangelogSignalData = z.object({
  releasesLast90d: z.number().int().min(0),
  daysSinceLastRelease: z.number().min(0),
  latestVersion: z.string().nullable(),
});
export type ChangelogSignalDataType = z.infer<typeof ChangelogSignalData>;

// ─── Score ───────────────────────────────────────────────

export const ScoreSchema = z.object({
  id: z.string().uuid().optional(),
  toolId: z.string(),
  radarScore: z.number().min(0).max(100),
  adoptionMomentum: z.number().min(0).max(100),
  developerSentiment: z.number().min(0).max(100),
  enterpriseReadiness: z.number().min(0).max(100),
  recency: z.number().min(0).max(100),
  buzz: z.number().min(0).max(100),
  weekOf: z.string(), // ISO date (YYYY-MM-DD)
  previousRadarScore: z.number().min(0).max(100).nullable(),
  delta: z.number().nullable(),
  createdAt: z.string().datetime().optional(),
});
export type Score = z.infer<typeof ScoreSchema>;

// ─── Comparison ──────────────────────────────────────────

export const ComparisonDimensionSchema = z.object({
  dimension: z.string(),
  toolAValue: z.number().min(0).max(100),
  toolBValue: z.number().min(0).max(100),
  winner: z.enum(["a", "b", "tie"]),
});
export type ComparisonDimension = z.infer<typeof ComparisonDimensionSchema>;

export const ComparisonSchema = z.object({
  id: z.string().uuid().optional(),
  toolAId: z.string(),
  toolBId: z.string(),
  comparisonBlurb: z.string().min(1),
  dimensions: z.array(ComparisonDimensionSchema),
  generatedAt: z.string().datetime(),
  weekOf: z.string(),
});
export type Comparison = z.infer<typeof ComparisonSchema>;

// ─── Pipeline Run ────────────────────────────────────────

export const PipelineRunSchema = z.object({
  id: z.string().uuid().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  status: PipelineStatusEnum,
  toolsProcessed: z.number().int().min(0),
  errors: z.array(z.record(z.string(), z.unknown())).nullable(),
  runType: RunTypeEnum,
});
export type PipelineRun = z.infer<typeof PipelineRunSchema>;

// ─── Digest Subscriber ──────────────────────────────────

export const DigestSubscriberSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  createdAt: z.string().datetime().optional(),
  unsubscribedAt: z.string().datetime().nullable(),
});
export type DigestSubscriber = z.infer<typeof DigestSubscriberSchema>;

// ─── Tool DB row (full DB shape, superset of ToolSchema) ─

export const ToolRowSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category_id: z.string().uuid(),
  summary: z.string().nullable(),
  use_cases: z.array(z.string()).nullable(),
  pricing_tier: PricingTierEnum,
  self_hostable: z.boolean(),
  api_available: z.boolean(),
  website_url: z.string().url().nullable(),
  github_url: z.string().url().nullable(),
  logo_url: z.string().url().nullable(),
  is_dead: z.boolean(),
  dead_since: z.string().datetime().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type ToolRow = z.infer<typeof ToolRowSchema>;
