# AIRadar — Roadmap

> AI tools, scored by signals — not opinions.

---

## Completed

### Foundation
- [x] Project scaffolding — Next.js 16, React 19, TypeScript, Tailwind v4, App Router
- [x] Neon Postgres database with Drizzle ORM (schema, migration, indexes)
- [x] Zod schemas for tools, signals, scores, comparisons, categories
- [x] RadarScore scoring engine — 5 equal-weight sub-scores, percentile normalization, unit tests
- [x] Seed script — 50 tools across 5 categories (LLM, Coding, Agents, Infra, Vertical)

### Agent Pipeline
- [x] 6 crawler agents — GitHub, Reddit, Hacker News, ArXiv, G2, Changelog
- [x] Enrichment agent — Claude-powered tool profiles and head-to-head comparisons
- [x] Inngest orchestration — weekly cron (`0 6 * * 1`), tiered updates (top 50 weekly, rest monthly)
- [x] Pipeline dry-run verified — 50 tools processed, 181 signals, 50 scores, 6 AI comparisons

### Frontend (7 public routes + admin)
- [x] Homepage `/` — category nav, top movers (▲/▼ deltas), featured leaderboard
- [x] Category pages `/category/[category]` — ranked table with RadarScore and sub-scores
- [x] Tool profiles `/tool/[slug]` — radar chart, trend chart, score breakdown, signal sources
- [x] Compare page `/compare` — side-by-side table, dual radar overlay, AI comparison blurbs
- [x] Leaderboard `/leaderboard` — global cross-category rankings with category filter tabs
- [x] Methodology `/methodology` — scoring formula, data sources, transparency statement
- [x] Graveyard `/graveyard` — stagnant/dead tools with last scores and dead-since dates
- [x] Admin `/admin` — pipeline run history, tool count, score overview (force-dynamic)

### API Routes
- [x] `/api/inngest` — Inngest webhook handler
- [x] `/api/revalidate` — ISR cache invalidation
- [x] `/api/subscribe` — digest email subscription
- [x] `/api/digest` — weekly digest trigger
- [x] `/api/og` — dynamic OG image generation (`@vercel/og`)
- [x] `/rss.xml` — RSS feed
- [x] `/sitemap.xml` — dynamic sitemap
- [x] `/robots.txt` — robots configuration

### SEO & Performance
- [x] Dynamic sitemap and robots.txt generation
- [x] OG image generation per tool
- [x] Meta tags on all pages
- [x] Lighthouse audit — Performance 98, Accessibility 96, Best Practices 100, SEO 100

### Testing & Deployment
- [x] Smoke test — 13 routes return HTTP 200
- [x] Playwright E2E — 34 tests (17 desktop + 17 mobile), all passing
- [x] Vitest unit tests for scoring engine
- [x] Deployed to Vercel — [aidar-nine.vercel.app](https://aidar-nine.vercel.app)
- [x] GitHub repo — [smithdavedesign/AI-Trend-Tracker](https://github.com/smithdavedesign/AI-Trend-Tracker)
- [x] Fixed build: switched DB pages to `force-dynamic` to avoid prerender failures

---

## Backlog

### Data Quality (High Priority)
- [ ] Replace G2 crawler with real scraping or official API — current implementation uses Claude estimation (unreliable)
- [ ] Add Product Hunt crawler for launch data and upvotes
- [ ] Add npm download stats to adoption momentum signal
- [ ] Add GitHub authenticated API calls (currently unauthenticated, 60 req/hr limit)
- [ ] Implement anomaly detection for score-gaming (sudden star spikes, review floods)
- [ ] Add source citation requirements to enrichment agent prompts to reduce hallucination

### Pipeline Improvements
- [ ] Connect Inngest Cloud for production cron (currently dev-only with `INNGEST_DEV=1`)
- [ ] Add retry/backoff logic per crawler (currently fail-continue)
- [ ] Add `needs_review` flagging for low-confidence enrichment outputs
- [ ] Dead tool detection — auto-flag tools with no activity for 90+ days
- [ ] Pipeline alerting — notify on run failures or anomalous score swings

### Frontend Enhancements
- [ ] Client-side sort/filter controls on leaderboard and category pages
- [ ] Sticky first column on mobile table views
- [ ] "Compare with..." tool switcher dropdowns on comparison page
- [ ] 12-week trend sparklines on leaderboard rows
- [ ] JSON-LD structured data on tool profile pages
- [ ] Dark mode support
- [ ] Search / command palette for quick tool lookup

### Admin & Ops
- [ ] Admin authentication gate (currently unprotected)
- [ ] Manual score override interface
- [ ] Review queue for flagged enrichment outputs
- [ ] Dead tool management UI (mark/unmark, set dead_since)
- [ ] Pipeline cost tracking dashboard

### Digest & Engagement
- [ ] Wire up Resend for actual weekly email delivery
- [ ] Rich email template with top movers, new entries, and graveyard additions
- [ ] Unsubscribe flow for digest subscribers
- [ ] JSON Feed at `/feed.json` for feed readers

### Infrastructure
- [ ] Custom domain (replace vercel.app URL)
- [ ] Edge caching strategy — return to ISR once env vars are properly scoped
- [ ] Rate limit API routes
- [ ] Error monitoring (Sentry or similar)
- [ ] Database connection pooling via Neon pooler endpoint

### Future (v2+)
- [ ] User accounts with watchlists and custom alerts
- [ ] "Breaking" tag for major releases between weekly runs (GitHub webhook listener)
- [ ] Historical score archive and long-term trend analysis
- [ ] Embeddable badge/widget for tool maintainers
- [ ] Public API for programmatic access to scores and signals
- [ ] Category-specific weighting profiles (e.g., weight enterprise readiness higher for infra tools)
