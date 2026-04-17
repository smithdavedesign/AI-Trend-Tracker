Here's the full PRD:

---

# Feature: AIRadar — Automated AI Trend Intelligence Platform

## Problem

CTOs, engineering managers, and senior engineers spend hours per week manually scanning Hacker News, Twitter/X, Reddit, newsletters, and vendor blogs to stay current on the AI tooling landscape. There's no single, authoritative, always-fresh source that aggregates, scores, and compares AI tools with the rigor of a technical evaluator. Existing options like Product Hunt are too broad, and arena.lmsys.org is too narrowly focused on LLM chat quality. Engineers and leaders need a destination that acts like a trusted peer who did all the research — and updates itself automatically every week.

## Success Criteria

- A publicly accessible, ungated web app is live and rendering real AI trend data
- The agentic pipeline runs on a weekly cadence and successfully updates all tool profiles, scores, and leaderboards without human intervention
- Each tracked tool has a structured profile with a composite score derived from ≥3 distinct signal sources (adoption, sentiment, GitHub activity, etc.)
- Comparison tables and leaderboards are auto-generated across all tracked categories: LLMs, coding tools, agents & workflows, infra/MLOps, and vertical AI
- A CTO or EM can open the site, find a category, read a head-to-head comparison, and make a vendor shortlist decision within 10 minutes
- Weekly digest email/RSS is available for users who opt in
- Lighthouse performance score ≥ 85 on mobile and desktop

## Constraints

- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS only
- Backend: Edge-compatible API routes or serverless functions (Vercel/Cloudflare Workers) — no persistent custom backend servers
- Data persistence: Postgres via Neon (serverless) with Drizzle ORM; structured JSON stored in a CDN-friendly format for static rendering
- Agents: LLM-powered agents (Claude or GPT-4o) with tool use / function calling for web scraping and data enrichment
- Agent orchestration: LangGraph or a lightweight task queue (e.g., Inngest, Trigger.dev) — no heavy infra like Kubernetes
- All content must be publicly readable — zero auth gates on any page
- Scraping must respect robots.txt and rate limits; no ToS violations
- No new authentication flow for content consumption (auth only for admin/agent dashboard, scoped to internal use)

## Non-goals

- No user-generated reviews or community voting (v1 — purely agent-curated)
- No redesign of any third-party site or API integration beyond read access
- No real-time data streaming — weekly batch is sufficient for v1
- No mobile native app
- No monetization, ads, or paywalled tiers in v1
- No fine-tuning or training of custom models — uses hosted APIs only

## System Design

- **Crawler Agents** periodically scrape signals from GitHub (stars, forks, release velocity), Reddit (`r/MachineLearning`, `r/LocalLLaMA`, etc.), Hacker News (Show HN, Ask HN), ArXiv (paper citations), product changelogs, and review sites (G2, Product Hunt). Each agent is a Claude/GPT-4o tool-use loop with a structured output schema
- **Scoring Engine** is a stateless serverless function that ingests raw signal data and computes a composite `RadarScore` (0–100) using weighted sub-scores: adoption momentum, sentiment polarity, developer buzz, enterprise readiness, and recency
- **Enrichment Agent** generates structured tool profiles (summary, use cases, pricing tier, API availability, self-hostable flag) and comparison blurbs by prompting the LLM with aggregated signal data
- **Data Store** uses a Neon serverless Postgres DB (accessed via Drizzle ORM) as the source of truth. A weekly cron job triggers the full pipeline: crawl → score → enrich → write to DB → invalidate CDN cache
- **Next.js frontend** uses Incremental Static Regeneration (ISR) to serve pre-rendered pages at the edge, pulling from Neon Postgres on revalidation. Dynamic filters and sort controls are client-side only
- **Leaderboard & Comparison Engine** is a server component that queries the DB and renders ranked tables and radar charts per category. Tool-vs-tool comparison pages are dynamically generated at `/compare/[tool-a]-vs-[tool-b]`
- **Admin Dashboard** (auth-gated, internal only) surfaces agent run logs, score diffs week-over-week, and a manual override interface for flagging bad data
- **Digest Generator** is a weekly serverless function that templates a markdown digest from the top movers and sends via Resend or similar; RSS feed is a static JSON feed file written to `/public/feed.json` on each pipeline run

## Task Breakdown

- [ ] 1. Define and document the `RadarScore` schema and all sub-score weights
- [ ] 2. Set up Neon Postgres schema via Drizzle ORM: `tools`, `scores`, `signals`, `categories`, `comparisons` tables
- [ ] 3. Build crawler agent scaffolding with tool-use loop (GitHub, HN, Reddit, G2 adapters)
- [ ] 4. Implement the Scoring Engine as a pure function with unit tests
- [ ] 5. Build the Enrichment Agent prompt chain with structured output validation (Zod)
- [ ] 6. Wire agent orchestration via Inngest or Trigger.dev with weekly cron trigger
- [ ] 7. Scaffold Next.js 14 app with App Router, Tailwind, and Drizzle ORM client
- [ ] 8. Build `/` homepage: category nav, top movers, featured leaderboard
- [ ] 9. Build `/category/[slug]` leaderboard pages with sort/filter controls
- [ ] 10. Build `/tool/[slug]` profile pages with RadarScore breakdown, signal sources, changelog
- [ ] 11. Build `/compare/[tool-a]-vs-[tool-b]` dynamic comparison pages
- [ ] 12. Build `/leaderboard` global cross-category rankings page
- [ ] 13. Implement ISR revalidation hooks tied to the weekly pipeline run
- [ ] 14. Build internal admin dashboard for pipeline monitoring and manual overrides
- [ ] 15. Implement RSS/JSON digest feed and Resend weekly email digest
- [ ] 16. SEO: generate `sitemap.xml`, `og:image` per tool via `@vercel/og`, structured data (JSON-LD)
- [ ] 17. Write E2E tests (Playwright) for critical user flows
- [ ] 18. Deploy to Vercel; configure Neon production database and secrets

## Acceptance Tests

- **Given** the weekly pipeline has run, **when** a user visits `/category/llm`, **then** they see ≥10 tools ranked by RadarScore with scores that differ from the prior week if signals changed
- **Given** a user visits `/compare/cursor-vs-github-copilot`, **when** the page loads, **then** a side-by-side comparison table renders with scores across ≥5 dimensions and no auth prompt appears
- **Given** the Enrichment Agent runs on a new tool, **when** it writes to the DB, **then** the tool profile must pass Zod validation against the following schema:
```json
{
  "id": "string (slug)",
  "name": "string",
  "category": "llm | coding | agents | infra | vertical",
  "radarScore": "number (0–100)",
  "subScores": {
    "adoptionMomentum": "number",
    "developerSentiment": "number",
    "enterpriseReadiness": "number",
    "recency": "number",
    "buzz": "number"
  },
  "pricingTier": "free | freemium | paid | enterprise",
  "selfHostable": "boolean",
  "lastUpdated": "ISO8601 timestamp",
  "signalSources": ["string"]
}
```
- **Given** a crawler agent hits a source that returns a 429 or blocks, **when** the error is caught, **then** the agent backs off, logs the failure, and the pipeline continues without crashing
- **Given** a user is on mobile (375px viewport), **when** they visit any leaderboard page, **then** the table scrolls horizontally and no content is clipped

## Risks

- **Scraping reliability**: Sources like Reddit, HN, and G2 may change their structure or rate-limit aggressively — mitigate with fallback parsers, cached last-known-good data, and a manual override layer
- **LLM hallucination in profiles**: The Enrichment Agent may generate plausible but inaccurate tool descriptions — mitigate with source citation requirements in the prompt and a human-review flag for low-confidence outputs
- **Score gaming**: Vendors may inflate GitHub stars or orchestrate review campaigns — mitigate with anomaly detection (sudden spike flagging) and multi-source weighting that dilutes single-source manipulation
- **Pipeline cost**: Weekly LLM enrichment across hundreds of tools could be expensive — mitigate with tiered update frequency (top 50 tools weekly, long tail monthly) and caching enriched profiles until signals change materially
- **Data freshness perception**: Weekly cadence may feel stale during fast-moving AI news weeks — mitigate with a "breaking" tag for tools with major releases between runs, triggered by a lightweight GitHub webhook listener

---

And here's a visual of the system architecture:The architecture diagram is interactive — click any box to drill into that component.

A few things worth flagging as you move into execution:

The trickiest engineering decision is the agent orchestration layer. Inngest and Trigger.dev both work well here, but the key constraint is that each weekly run may involve 50–200 tool-use LLM calls (one per tracked tool, per enrichment pass). At $3–5/1M tokens for Claude Sonnet, a full run could easily hit $20–50 — so the tiered update frequency in the risks section (top 50 weekly, long tail monthly) isn't optional, it's a budget control.

The second thing to nail early is the `RadarScore` weighting model (Task 1 in the breakdown). Everything downstream — the leaderboards, comparisons, digest — is only as good as that formula. I'd recommend shipping a v0 with equal weights across 5 sub-scores, then iterating based on whether the rankings pass the "smell test" with a few known tools (e.g. does Cursor rank above a tool that quietly died 8 months ago?).

Want me to go deeper on any section — the Zod schema, the scoring algorithm design, or the Next.js ISR + Neon/Drizzle wiring?