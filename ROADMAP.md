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
- [x] Removed stale Supabase migration — Neon + Drizzle is sole DB setup

### Agent Pipeline
- [x] 6 crawler agents — GitHub, Reddit, Hacker News, ArXiv, G2, Changelog
- [x] Enrichment agent — Claude-powered tool profiles and head-to-head comparisons
- [x] Inngest orchestration — weekly cron (`0 6 * * 1`), tiered updates (top 50 weekly, rest monthly)
- [x] Pipeline dry-run verified — 50 tools processed, 181 signals, 50 scores, 6 AI comparisons
- [x] GitHub authenticated API calls — `GITHUB_TOKEN` configured (5,000 req/hr vs 60 unauthenticated)
- [x] npm weekly download stats — `npmPackage` field on tools, fetched from `api.npmjs.org` (free, no auth), factored into adoption momentum sub-score
- [x] Dead tool auto-detection — pipeline step flags tools with zero commits + no release in 90+ days (`is_dead = true`, `dead_since` set automatically)

### Frontend (7 public routes + admin)
- [x] Homepage `/` — category nav, top movers (▲/▼ deltas), featured leaderboard
- [x] Category pages `/category/[category]` — ranked table with sort controls (RadarScore, Name, Adoption, Recency)
- [x] Tool profiles `/tool/[slug]` — radar chart, trend chart, score breakdown, signal sources, JSON-LD structured data
- [x] Compare page `/compare` — side-by-side table, dual radar overlay, AI comparison blurbs, sticky first column on mobile
- [x] Leaderboard `/leaderboard` — global cross-category rankings with category filters and 12-week sparklines per row
- [x] Methodology `/methodology` — scoring formula, data sources, transparency statement
- [x] Graveyard `/graveyard` — stagnant/dead tools with last scores and dead-since dates
- [x] Admin `/admin` — pipeline run history, tool count, score overview, password-protected

### API Routes
- [x] `/api/inngest` — Inngest webhook handler
- [x] `/api/revalidate` — ISR cache invalidation
- [x] `/api/subscribe` — digest email subscription
- [x] `/api/digest` — weekly digest trigger
- [x] `/api/og` — dynamic OG image generation (`@vercel/og`)
- [x] `/api/admin/login` — admin session login (cookie-based)
- [x] `/rss.xml` — RSS feed
- [x] `/feed.json` — JSON Feed 1.1 for feed readers
- [x] `/sitemap.xml` — dynamic sitemap
- [x] `/robots.txt` — robots configuration

### SEO & Performance
- [x] Dynamic sitemap and robots.txt generation
- [x] OG image generation per tool
- [x] Meta tags on all pages
- [x] JSON-LD structured data (`SoftwareApplication` schema) on all tool profile pages
- [x] Lighthouse audit — Performance 98, Accessibility 96, Best Practices 100, SEO 100

### Security & Admin
- [x] Admin auth gate — middleware redirects `/admin` to `/admin/login`; session cookie checked on every request
- [x] `ADMIN_PASSWORD` env var — set in `.env.local` and Vercel environment variables

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
- [x] Replace G2 crawler with real scraping — fetches JSON-LD `AggregateRating` from g2.com product pages; returns null (not hallucinated data) when blocked
- [x] Add Product Hunt crawler — `PRODUCT_HUNT_TOKEN` env var, GraphQL API, votes + launch data
- [x] Populate `npm_package` field on seeded tools — 11 tools mapped, `set-npm-packages.ts` script run
- [x] Anomaly detection — post-scoring step compares delta to 8-week history; flags >2σ swings in `pipeline_runs.errors`
- [x] Source citations in enrichment — prompt now requires blurb to cite specific sub-score differences, not speculate beyond data; confidence field returned and stored

### Pipeline Improvements
- [ ] Connect Inngest Cloud for production cron — set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` and remove `INNGEST_DEV=1`
- [x] Add retry/backoff logic per crawler — exponential backoff, 3 attempts, 1s/2s/4s delays
- [x] `needs_review` flagging — Claude returns `confidence` (0–100); comparisons with confidence < 60 stored with `needsReview: true` in dimensions JSONB; surfaced in admin review queue
- [x] Pipeline alerting — anomaly alerts shown as banner in admin dashboard; per-run issues split into crawl errors vs anomalies in run history table

### Frontend Enhancements
- [x] "Compare with..." tool switcher dropdowns on comparison page — grouped `<select>` by category
- [x] Dark mode support — CSS variable swap, system/dark/light toggle, anti-flash inline script
- [x] Search / command palette for quick tool lookup — Cmd+K, lazy fetch via `/api/tools`, keyboard nav
- [ ] Sticky first column on category page mobile (low priority — ToolCard list view, not table)

### Admin & Ops
- [x] Manual score override interface — sliders for all 5 sub-scores, RadarScore recalculated, stored via `POST /api/admin/tools/[id]/score`
- [x] Review queue for flagged enrichment outputs — recent comparisons panel; low-confidence ones highlighted
- [x] Dead tool management UI — admin table with Mark Live button, `PATCH /api/admin/tools/[id]`
- [ ] Pipeline cost tracking dashboard — track Claude API call counts per run

### Digest & Engagement
- [x] Wire up Resend for actual weekly email delivery — `RESEND_API_KEY` set; `RESEND_FROM` env var controls sender; tested delivery confirmed
- [x] Rich email template — HTML table of top movers with scores and deltas, CTA button
- [x] Unsubscribe flow — HMAC-signed token links, `GET /api/unsubscribe`, `/unsubscribe` confirmation page

### Infrastructure
- [ ] Custom domain (replace vercel.app URL)
- [ ] Edge caching / ISR — blocked by `DATABASE_URL` not available at Vercel build time; keep `force-dynamic` until Vercel resolves env scoping
- [x] Rate limit API routes — sliding window in middleware: subscribe/unsubscribe (5/min), admin login (10/min), digest (3/min)
- [ ] Error monitoring (Sentry or similar)
- [x] Database connection pooling — use Neon pooler endpoint (`ep-xxx-pooler.…`) in `DATABASE_URL`; documented in `.env.local.example`

### Future (v2+)
- [ ] User accounts with watchlists and custom alerts
- [ ] "Breaking" tag for major releases between weekly runs (GitHub webhook listener)
- [ ] Historical score archive and long-term trend analysis
- [ ] Embeddable badge/widget for tool maintainers
- [ ] Public API for programmatic access to scores and signals
- [ ] Category-specific weighting profiles (e.g., weight enterprise readiness higher for infra tools)
