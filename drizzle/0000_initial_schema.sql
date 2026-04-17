-- Neon Postgres migration — no RLS, no Supabase auth functions
-- Run this against your Neon database to create the schema.

-- Enums
CREATE TYPE pricing_tier AS ENUM ('free', 'freemium', 'paid', 'enterprise');
CREATE TYPE signal_source AS ENUM ('github', 'reddit', 'hn', 'arxiv', 'g2', 'ph', 'changelog');
CREATE TYPE pipeline_status AS ENUM ('running', 'completed', 'failed');
CREATE TYPE run_type AS ENUM ('full', 'incremental');

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Tools
CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  use_cases TEXT[],
  pricing_tier pricing_tier NOT NULL DEFAULT 'free',
  self_hostable BOOLEAN NOT NULL DEFAULT false,
  api_available BOOLEAN NOT NULL DEFAULT false,
  website_url TEXT,
  github_url TEXT,
  logo_url TEXT,
  is_dead BOOLEAN NOT NULL DEFAULT false,
  dead_since TIMESTAMPTZ,
  radar_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  sub_scores JSONB DEFAULT '{}',
  signal_sources TEXT[] DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tools_category ON tools(category);

-- Signals
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL REFERENCES tools(id),
  source signal_source NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signals_tool_source ON signals(tool_id, source);
CREATE INDEX idx_signals_fetched ON signals(fetched_at);

-- Scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL REFERENCES tools(id),
  radar_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  adoption_momentum NUMERIC(5,2) NOT NULL DEFAULT 0,
  developer_sentiment NUMERIC(5,2) NOT NULL DEFAULT 0,
  enterprise_readiness NUMERIC(5,2) NOT NULL DEFAULT 0,
  recency NUMERIC(5,2) NOT NULL DEFAULT 0,
  buzz NUMERIC(5,2) NOT NULL DEFAULT 0,
  week_of DATE NOT NULL,
  previous_radar_score NUMERIC(5,2),
  delta NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_scores_tool_week ON scores(tool_id, week_of);
CREATE INDEX idx_scores_week ON scores(week_of);

-- Comparisons
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_a_id TEXT NOT NULL REFERENCES tools(id),
  tool_b_id TEXT NOT NULL REFERENCES tools(id),
  comparison_blurb TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_of DATE NOT NULL,
  CONSTRAINT comparisons_order_check CHECK (tool_a_id < tool_b_id)
);

CREATE UNIQUE INDEX idx_comparisons_pair_week ON comparisons(tool_a_id, tool_b_id, week_of);

-- Pipeline Runs
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status pipeline_status NOT NULL DEFAULT 'running',
  tools_processed INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  run_type run_type NOT NULL DEFAULT 'full'
);

-- Digest Subscribers
CREATE TABLE digest_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);
