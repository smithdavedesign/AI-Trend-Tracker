import {
  pgTable,
  pgEnum,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  numeric,
  date,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

export const pricingTierEnum = pgEnum("pricing_tier", [
  "free",
  "freemium",
  "paid",
  "enterprise",
]);

export const signalSourceEnum = pgEnum("signal_source", [
  "github",
  "reddit",
  "hn",
  "arxiv",
  "g2",
  "ph",
  "changelog",
]);

export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "running",
  "completed",
  "failed",
]);

export const runTypeEnum = pgEnum("run_type", ["full", "incremental"]);

// ─── Categories ──────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});

// ─── Tools ───────────────────────────────────────────────

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    summary: text("summary"),
    useCases: text("use_cases").array(),
    pricingTier: pricingTierEnum("pricing_tier").notNull().default("free"),
    selfHostable: boolean("self_hostable").notNull().default(false),
    apiAvailable: boolean("api_available").notNull().default(false),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    logoUrl: text("logo_url"),
    npmPackage: text("npm_package"),
    isDead: boolean("is_dead").notNull().default(false),
    deadSince: timestamp("dead_since", { withTimezone: true }),
    radarScore: numeric("radar_score", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    subScores: jsonb("sub_scores").default({}),
    signalSources: text("signal_sources").array().default([]),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_tools_category").on(t.category)]
);

// ─── Signals ─────────────────────────────────────────────

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id),
    source: signalSourceEnum("source").notNull(),
    rawData: jsonb("raw_data").notNull().default({}),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_signals_tool_source").on(t.toolId, t.source),
    index("idx_signals_fetched").on(t.fetchedAt),
  ]
);

// ─── Scores ──────────────────────────────────────────────

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id),
    radarScore: numeric("radar_score", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    adoptionMomentum: numeric("adoption_momentum", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    developerSentiment: numeric("developer_sentiment", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"),
    enterpriseReadiness: numeric("enterprise_readiness", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"),
    recency: numeric("recency", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    buzz: numeric("buzz", { precision: 5, scale: 2 }).notNull().default("0"),
    weekOf: date("week_of").notNull(),
    previousRadarScore: numeric("previous_radar_score", {
      precision: 5,
      scale: 2,
    }),
    delta: numeric("delta", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_scores_tool_week").on(t.toolId, t.weekOf),
    index("idx_scores_week").on(t.weekOf),
  ]
);

// ─── Comparisons ─────────────────────────────────────────

export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toolAId: text("tool_a_id")
      .notNull()
      .references(() => tools.id),
    toolBId: text("tool_b_id")
      .notNull()
      .references(() => tools.id),
    comparisonBlurb: text("comparison_blurb").notNull(),
    dimensions: jsonb("dimensions").notNull().default([]),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    weekOf: date("week_of").notNull(),
  },
  (t) => [
    uniqueIndex("idx_comparisons_pair_week").on(t.toolAId, t.toolBId, t.weekOf),
    check("comparisons_order_check", sql`tool_a_id < tool_b_id`),
  ]
);

// ─── Pipeline Runs ───────────────────────────────────────

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: pipelineStatusEnum("status").notNull().default("running"),
  toolsProcessed: integer("tools_processed").notNull().default(0),
  errors: jsonb("errors").default([]),
  runType: runTypeEnum("run_type").notNull().default("full"),
  stats: jsonb("stats").default({}),
});

// ─── Digest Subscribers ──────────────────────────────────

export const digestSubscribers = pgTable("digest_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});
