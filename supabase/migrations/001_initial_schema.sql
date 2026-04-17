-- AIRadar: Initial schema migration
-- Run against Supabase Postgres

-- ─── Enums ────────────────────────────────────────────────

CREATE TYPE pricing_tier AS ENUM ('free', 'freemium', 'paid', 'enterprise');
CREATE TYPE signal_source AS ENUM ('github', 'reddit', 'hn', 'arxiv', 'g2', 'ph', 'changelog');
CREATE TYPE pipeline_status AS ENUM ('running', 'completed', 'failed');
CREATE TYPE run_type AS ENUM ('full', 'incremental');

-- ─── Categories ───────────────────────────────────────────

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0
);

-- ─── Tools ────────────────────────────────────────────────

CREATE TABLE tools (
  id TEXT PRIMARY KEY, -- slug (e.g. "cursor", "gpt-4o")
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tools_category ON tools(category_id);
CREATE INDEX idx_tools_is_dead ON tools(is_dead);

-- ─── Signals ──────────────────────────────────────────────

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL REFERENCES tools(id),
  source signal_source NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signals_tool_source ON signals(tool_id, source);
CREATE INDEX idx_signals_fetched ON signals(fetched_at DESC);

-- ─── Scores ───────────────────────────────────────────────

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
CREATE INDEX idx_scores_week ON scores(week_of DESC);

-- ─── Comparisons ──────────────────────────────────────────

CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_a_id TEXT NOT NULL REFERENCES tools(id),
  tool_b_id TEXT NOT NULL REFERENCES tools(id),
  comparison_blurb TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_of DATE NOT NULL,
  CHECK (tool_a_id < tool_b_id) -- canonical ordering
);

CREATE UNIQUE INDEX idx_comparisons_pair_week ON comparisons(tool_a_id, tool_b_id, week_of);

-- ─── Pipeline Runs ────────────────────────────────────────

CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status pipeline_status NOT NULL DEFAULT 'running',
  tools_processed INT NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  run_type run_type NOT NULL DEFAULT 'full'
);

-- ─── Digest Subscribers ───────────────────────────────────

CREATE TABLE digest_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ─── Updated_at trigger ──────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ──────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read tools" ON tools FOR SELECT USING (true);
CREATE POLICY "Public read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public read comparisons" ON comparisons FOR SELECT USING (true);

-- Service role write access (pipeline + admin)
CREATE POLICY "Service write categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write tools" ON tools FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write scores" ON scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write comparisons" ON comparisons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write signals" ON signals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write pipeline_runs" ON pipeline_runs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write digest_subscribers" ON digest_subscribers FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous insert for digest subscribe
CREATE POLICY "Public subscribe" ON digest_subscribers FOR INSERT WITH CHECK (true);

-- ─── Seed Categories ──────────────────────────────────────

INSERT INTO categories (slug, name, description, display_order) VALUES
  ('llm', 'Large Language Models', 'Foundation models and chat APIs — GPT, Claude, Gemini, Llama, and more', 1),
  ('coding', 'Coding Tools', 'AI-powered code editors, copilots, and developer productivity tools', 2),
  ('agents', 'Agents & Workflows', 'Agent frameworks, orchestration libraries, and autonomous AI toolkits', 3),
  ('infra', 'Infra & MLOps', 'Model hosting, training platforms, experiment tracking, and ML infrastructure', 4),
  ('vertical', 'Vertical AI', 'Domain-specific AI — image, video, audio, writing, legal, and more', 5);
