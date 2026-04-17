import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { tools } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidar.vercel.app";

  const db = getDb();
  const allTools = await db
    .select({ id: tools.id, lastUpdated: tools.lastUpdated })
    .from(tools);

  const categories = ["llm", "coding", "agents", "infra", "vertical"];

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/leaderboard`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/compare`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/graveyard`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/category/${cat}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: `${siteUrl}/tool/${tool.id}`,
    lastModified: tool.lastUpdated ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
