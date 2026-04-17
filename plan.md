# AIRadar — Implementation Plan

## Overview

Build the complete AIRadar platform: an agentic data pipeline (Inngest + Claude), Neon serverless Postgres persistence (Drizzle ORM), Next.js 14 frontend with ISR, admin dashboard, digest system, deployed to Vercel. ~50 seed tools across 5 categories. Includes 3 features from competitor analysis that no existing product offers.

**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Neon Postgres + Drizzle ORM · Inngest · Claude API (Anthropic) · Recharts · Resend · Playwright

**Domain**: Vercel auto-generated `.vercel.app` (free/temp — custom domain later)

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Orchestration | Inngest | Event-driven, Vercel-native, built-in retries and fan-out |
| LLM provider | Claude (Anthropic) | Both crawler and enrichment agents |
| Database | Neon Postgres + Drizzle ORM | Serverless, generous free tier, drop-in Postgres replacement |
| Deployment | Vercel | Accounts exist, ISR + edge functions native |
| Seed size | ~50 tools | Across 5 categories, matches "top 50 weekly" cost tier |
| Scope | All 18 PRD tasks + 3 competitor analysis features | Methodology page, WoW deltas, dead tools graveyard |
| Sub-score weights | Equal 20% each (v0) | Iterate after "smell test" with known tools |
| Tiered updates | Top-50 weekly, rest monthly — handled in code | No extra DB column, query top 50 by RadarScore at pipeline start |
| Brand | Custom SVG logo + color palette | See `public/logo.svg` and brand section below |

---

## Brand Identity

- **Name**: AIRadar
- **Tagline**: "AI tools, scored by signals — not opinions"
- **Primary**: `#6366F1` (Indigo 500) — trust, intelligence, tech
- **Secondary**: `#10B981` (Emerald 500) — growth, positive signals
- **Accent**: `#F59E0B` (Amber 500) — attention, alerts, deltas
- **Danger**: `#EF4444` (Red 500) — negative deltas, dead tools
- **Background**: `#FAFAF9` (Stone 50)
- **Text**: `#1C1917` (Stone 900)
- **Logo**: Radar sweep icon — see `public/logo.svg`
- **Font**: Inter (via `next/font/google`)

---

## Phase 1: Foundation

> Blocks everything. Must be completed first.

### Step 1: Project Scaffolding

- `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint, `--src-dir`
- Core deps: `@neondatabase/serverless drizzle-orm inngest zod @anthropic-ai/sdk recharts resend`
- Dev deps: `drizzle-kit @types/node`
- Env vars (`.env.local`): `DATABASE_URL`, `ANTHROPIC_API_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `RESEND_API_KEY`, `REVALIDATION_SECRET`

```
src/
├── app/
│   ├── (public)/                 # Public route group
│   │   ├── page.tsx              # Homepage
│   │   ├── category/[slug]/
│   │   ├── tool/[slug]/
│   │   ├── compare/[slug]/
│   │   ├── leaderboard/
│   │   ├── methodology/
│   │   └── graveyard/
│   ├── admin/                    # Auth-gated
│   ├── api/
│   │   ├── inngest/route.ts
│   │   ├── revalidate/route.ts
│   │   └── digest/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── charts/
│   ├── leaderboard/
│   └── layout/
├── lib/
│   ├── schemas/
│   ├── scoring/
│   ├── agents/
│   │   ├── crawler/
│   │   └── enrichment/
│   ├── inngest/
│   └── db/                       # Drizzle schema + client
scripts/
├── seed-tools.ts
drizzle/
├── 0000_initial_schema.sql
e2e/
├── critical-flows.spec.ts
public/
├── logo.svg
└── feed.json
```

### Step 2: RadarScore Schema + Zod Types

**RadarScore formula (v0 — equal weights):**

| Sub-score | Weight | Signals |
|---|---|---|
| `adoptionMomentum` | 20% | GitHub stars velocity, npm download trend, G2 review count growth |
| `developerSentiment` | 20% | Reddit/HN comment sentiment, G2 satisfaction rating |
| `enterpriseReadiness` | 20% | SOC2 mentions, SSO support, self-host option, pricing tier |
| `recency` | 20% | Days since last release, changelog frequency, last commit |
| `buzz` | 20% | HN front-page hits, Reddit post count, ArXiv citation count |

Zod schemas in `src/lib/schemas/index.ts`:
- `CategoryEnum`: `z.enum(["llm", "coding", "agents", "infra", "vertical"])`
- `PricingTierEnum`: `z.enum(["free", "freemium", "paid", "enterprise"])`
- `SignalSourceEnum`: `z.enum(["github", "reddit", "hn", "arxiv", "g2", "ph", "changelog"])`
- `ToolSchema`: id (slug), name, category, radarScore (0–100), subScores, pricingTier, selfHostable, lastUpdated (ISO8601), signalSources[]
- `SignalSchema`: tool_id, source, raw_data (jsonb), fetched_at
- `ScoreSchema`: tool_id, all 5 sub-scores, radar_score, week_of, previous_radar_score, delta
- `ComparisonSchema`: tool_a_id, tool_b_id, comparison_blurb, dimensions, week_of

### Step 3: Neon Postgres Schema (Drizzle ORM)

Schema defined in `src/lib/db/schema.ts` using Drizzle pgTable/pgEnum.
Migration SQL in `drizzle/0000_initial_schema.sql`.

Tables:
1. `categories` — id (uuid PK), slug (unique), name, description, display_order
2. `tools` — id (slug PK), name, category_id FK, summary, use_cases[], pricing_tier enum, self_hostable bool, api_available bool, website_url, github_url, logo_url, is_dead bool, dead_since timestamptz, created_at, updated_at
3. `signals` — id uuid, tool_id FK, source enum, raw_data jsonb, fetched_at timestamptz
4. `scores` — id uuid, tool_id FK, radar_score numeric, adoption_momentum numeric, developer_sentiment numeric, enterprise_readiness numeric, recency numeric, buzz numeric, week_of date, previous_radar_score numeric, delta numeric, created_at
5. `comparisons` — id uuid, tool_a_id FK, tool_b_id FK, comparison_blurb text, dimensions jsonb, generated_at, week_of date
6. `pipeline_runs` — id uuid, started_at, completed_at, status enum, tools_processed int, errors jsonb, run_type enum
7. `digest_subscribers` — id uuid, email unique, created_at, unsubscribed_at

Indexes: `scores(tool_id, week_of)`, `signals(tool_id, source)`, `tools(category_id)`, `comparisons(tool_a_id, tool_b_id)`

RLS: Not applicable (Neon, no built-in auth). Write protection is app-layer only via service credentials.

### Step 4: Scoring Engine

`src/lib/scoring/compute-radar-score.ts` — pure function: `(signals, allToolsSignals?) => Score`
- Percentile-rank normalization per sub-score across all tools
- Equal 20% weight for v0
- Missing signal handling: redistribute weight across available sources
- Unit tests: full signals, partial, boundaries, determinism

---

## Phase 2: Agent Pipeline

> Depends on Phase 1.

### Step 5: Crawler Agents

Per-source adapters in `src/lib/agents/crawler/`:

| Adapter | API | Signals | Rate Limit |
|---|---|---|---|
| `github-adapter.ts` | GitHub REST API | Stars, forks, releases, commit freq | 5000/hr with token |
| `reddit-adapter.ts` | Reddit JSON API | Post count, sentiment | 60/min |
| `hn-adapter.ts` | Algolia HN API | Front-page hits, comments, points | Generous, backoff 429 |
| `arxiv-adapter.ts` | ArXiv Atom API | Paper count, citations | 1 req/3s |
| `g2-adapter.ts` | Public pages | Rating, review count | 1 req/5s |
| `changelog-adapter.ts` | Release pages | Release dates, velocity | Conservative |

Orchestrator `crawl-tool.ts`: runs all adapters, Claude resolves ambiguity, Zod-validated output to `signals` table. On adapter failure: log + continue.

### Step 6: Enrichment Agent

`enrich-tool.ts`: Claude generates profiles (summary, use cases, pricing, flags) + comparison blurbs. Zod validation before DB write. Low-confidence detection flags `needs_review`.

### Step 7: Inngest Orchestration

Weekly cron `0 6 * * 1` → crawl (fan-out, concurrency 10) → score → deltas → enrich (concurrency 5) → comparisons → dead tool detection → log run → trigger digest → revalidate ISR.

Tiered: top-50 by RadarScore weekly, rest monthly.

### Step 8: Seed + Dry Run

~50 tools across: LLMs (GPT-4o, Claude, Gemini, Llama, Mistral...), Coding (Cursor, Copilot, Cody...), Agents (LangChain, CrewAI...), Infra (HuggingFace, Replicate...), Vertical (Midjourney, ElevenLabs...).

---

## Phase 3: Frontend

> Depends on Phase 1. Shell work can parallel Phase 2.

### Step 9: App Shell

Root layout: Inter font, global nav (logo, categories dropdown, leaderboard, methodology), footer, responsive container. Mobile hamburger nav.

### Step 10: Homepage `/`

Hero → Category cards (5) → Top Movers This Week (▲/▼ deltas) → Featured leaderboard (top 10) → Recently Added. ISR revalidate=3600.

### Step 11: Category Leaderboard `/category/[slug]`

Ranked table: #, name, RadarScore, delta ▲/▼, 5 sub-scores. Client-side sort/filter (pricing, self-hostable). Mobile horizontal scroll + sticky first column.

### Step 12: Tool Profile `/tool/[slug]`

Radar chart (recharts), score breakdown + WoW delta, metadata badges, AI summary, use cases, signal sources, 12-week trend chart, "Compare with..." links.

### Step 13: Comparison `/compare/[slug]`

Side-by-side table + dual radar overlay + AI blurb + tool switcher dropdowns. Slug: `tool-a-vs-tool-b`.

### Step 14: Global Leaderboard `/leaderboard`

All tools, category filter tabs, same sort/filter/delta as category pages.

### Step 15: Methodology `/methodology`

Static page: RadarScore formula, sub-score definitions, data sources, update frequency, transparency statement. No competitor does this.

### Step 16: Graveyard `/graveyard`

Tools with `is_dead = true`, last score, dead_since date, sorted by most recent.

---

## Phase 4: Admin, Digest, SEO, Tests, Deploy

### Step 17: Admin Dashboard `/admin`

Auth-gated. Pipeline runs, score diffs, manual overrides, review queue, dead tool management.

### Step 18: Digest + RSS

JSON Feed at `/public/feed.json`, RSS XML at `/feed.xml`, Resend weekly email, subscribe form on homepage.

### Step 19: SEO

Dynamic `sitemap.ts`, `@vercel/og` images per tool, JSON-LD structured data, meta tags, `robots.txt`.

### Step 20: E2E Tests

Playwright: homepage, category ≥10 tools, comparison ≥5 dimensions, tool profile radar chart, mobile horizontal scroll, methodology page.

### Step 21: Deploy

Vercel + Neon production + Inngest cloud. Lighthouse ≥85.

---

## Verification Checklist

- [ ] `npm test` — scoring engine deterministic
- [ ] Seed script → 50 tools in DB
- [ ] Inngest dev trigger → signals + scores + enrichment written
- [ ] `npm run dev` → all pages render
- [ ] `npx playwright test` → all green
- [ ] Mobile 375px → tables scroll, nothing clipped
- [ ] Lighthouse ≥85
- [ ] PRD acceptance tests all pass
