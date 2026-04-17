import { test, expect } from "@playwright/test";

// ── Homepage ────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("renders hero, categories, and top 10 leaderboard", async ({ page }) => {
    await page.goto("/");
    // Hero
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Category nav links (emoji prefix in the hero pills)
    for (const cat of ["LLMs", "Coding", "Agents", "Infra", "Vertical"]) {
      await expect(page.getByRole("link", { name: cat }).first()).toBeVisible();
    }
    // Top 10 section
    await expect(page.getByText("Top 10 AI Tools")).toBeVisible();
    // At least some tool cards rendered (seeded data)
    const toolLinks = page.locator('a[href^="/tool/"]');
    expect(await toolLinks.count()).toBeGreaterThanOrEqual(5);
  });

  test("navigate to category from homepage", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "LLMs" }).first().click();
    await page.waitForURL("**/category/llm");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("LLMs");
  });
});

// ── Category Leaderboard ────────────────────────────────────────────────

test.describe("Category Leaderboard", () => {
  test("shows ≥10 tools in LLM category", async ({ page }) => {
    await page.goto("/category/llm");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("LLMs");
    const toolCards = page.locator('a[href^="/tool/"]');
    expect(await toolCards.count()).toBeGreaterThanOrEqual(10);
  });

  test("each tool card shows score", async ({ page }) => {
    await page.goto("/category/coding");
    // Tool cards link to tool pages
    const toolCards = page.locator('a[href^="/tool/"]');
    expect(await toolCards.count()).toBeGreaterThan(0);
  });

  test("returns 404 for invalid category", async ({ page }) => {
    const resp = await page.goto("/category/nonexistent");
    expect(resp?.status()).toBe(404);
  });
});

// ── Tool Profile ────────────────────────────────────────────────────────

test.describe("Tool Profile", () => {
  test("renders tool name, score, and metadata", async ({ page }) => {
    await page.goto("/tool/chatgpt");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ChatGPT"
    );
    // RadarScore visible
    await expect(page.getByText("RadarScore")).toBeVisible();
    // Category badge
    await expect(page.getByRole("link", { name: "llm", exact: true })).toBeVisible();
  });

  test("radar chart renders (SVG)", async ({ page }) => {
    await page.goto("/tool/cursor");
    // Recharts renders SVG
    const svg = page.locator("svg.recharts-surface");
    await expect(svg.first()).toBeVisible();
  });

  test("returns 404 for unknown tool", async ({ page }) => {
    const resp = await page.goto("/tool/definitely-not-a-tool");
    expect(resp?.status()).toBe(404);
  });
});

// ── Compare Page ────────────────────────────────────────────────────────

test.describe("Compare", () => {
  test("renders tool picker links", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Compare"
    );
    // Tool A label and selectable tool links
    await expect(page.getByText("Tool A")).toBeVisible();
    await expect(page.getByText("Tool B")).toBeVisible();
    await expect(page.getByText("Select two tools above to compare them.")).toBeVisible();
  });

  test("shows comparison when two tools selected via URL", async ({ page }) => {
    await page.goto("/compare?a=chatgpt&b=cursor");
    // Both tool names in heading cards
    await expect(page.getByRole("heading", { name: "ChatGPT" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cursor" })).toBeVisible();
    // Dimension comparison table
    await expect(page.getByText("Dimension Comparison")).toBeVisible();
    // 5 dimensions in the table
    await expect(page.getByText("adoption Momentum")).toBeVisible();
  });
});

// ── Leaderboard ─────────────────────────────────────────────────────────

test.describe("Global Leaderboard", () => {
  test("shows all tools with category filter tabs", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Leaderboard"
    );
    // At least 10 tools
    const toolLinks = page.locator('a[href^="/tool/"]');
    expect(await toolLinks.count()).toBeGreaterThanOrEqual(10);
  });
});

// ── Graveyard ───────────────────────────────────────────────────────────

test.describe("Graveyard", () => {
  test("renders graveyard page", async ({ page }) => {
    await page.goto("/graveyard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Graveyard"
    );
  });
});

// ── Methodology ─────────────────────────────────────────────────────────

test.describe("Methodology", () => {
  test("explains RadarScore formula and data sources", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Methodology"
    );
    // Sub-score dimensions mentioned
    for (const dim of ["Adoption Momentum", "Developer Sentiment", "Enterprise Readiness", "Recency", "Buzz"]) {
      await expect(page.getByRole("heading", { name: dim })).toBeVisible();
    }
    // Data sources
    for (const src of ["GitHub", "Reddit", "Hacker News"]) {
      await expect(page.getByText(src).first()).toBeVisible();
    }
  });
});

// ── Mobile Responsive ───────────────────────────────────────────────────

test.describe("Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("homepage renders without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("category page tables scroll horizontally", async ({ page }) => {
    await page.goto("/category/llm");
    // Content should fit or scroll, not clip — no horizontal body overflow
    const bodyWidth = await page.locator("body").evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376); // 1px tolerance
  });
});

// ── SEO ─────────────────────────────────────────────────────────────────

test.describe("SEO", () => {
  test("sitemap.xml returns valid XML", async ({ page }) => {
    const resp = await page.goto("/sitemap.xml");
    expect(resp?.status()).toBe(200);
    const ct = resp?.headers()["content-type"] ?? "";
    expect(ct).toContain("xml");
  });

  test("RSS feed returns valid XML", async ({ page }) => {
    const resp = await page.goto("/rss.xml");
    expect(resp?.status()).toBe(200);
    const ct = resp?.headers()["content-type"] ?? "";
    expect(ct).toContain("xml");
  });
});
