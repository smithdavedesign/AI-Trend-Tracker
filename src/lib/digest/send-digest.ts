import { Resend } from "resend";
import { getDb } from "@/lib/db";
import { digestSubscribers, scores, tools } from "@/lib/db/schema";
import { eq, desc, isNull, inArray } from "drizzle-orm";

export async function sendWeeklyDigest(weekOf: string) {
  if (!process.env.RESEND_API_KEY) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const db = getDb();

  // Get subscribers
  const subscribers = await db
    .select({ email: digestSubscribers.email })
    .from(digestSubscribers)
    .where(isNull(digestSubscribers.unsubscribedAt));

  if (subscribers.length === 0) return;

  // Get top movers this week
  const weekScores = await db
    .select({
      toolId: scores.toolId,
      radarScore: scores.radarScore,
      delta: scores.delta,
    })
    .from(scores)
    .where(eq(scores.weekOf, weekOf))
    .orderBy(desc(scores.delta))
    .limit(10);

  if (weekScores.length === 0) return;

  // Get tool names
  const toolIds = weekScores.map((s) => s.toolId);
  const toolRows = await db
    .select({ id: tools.id, name: tools.name })
    .from(tools)
    .where(inArray(tools.id, toolIds));

  const toolMap = new Map(toolRows.map((t) => [t.id, t.name]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidar.vercel.app";

  // Build email HTML
  const moversHtml = weekScores
    .map((s) => {
      const name = toolMap.get(s.toolId) ?? s.toolId;
      const score = Number(s.radarScore);
      const delta = Number(s.delta ?? 0);
      const arrow = delta >= 0 ? "↑" : "↓";
      const color = delta >= 0 ? "#10B981" : "#EF4444";
      return `<tr>
        <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;">
          <a href="${siteUrl}/tool/${s.toolId}" style="color:#6366F1;text-decoration:none;">${name}</a>
        </td>
        <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">
          ${score.toFixed(1)}
        </td>
        <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color};font-weight:600;">
          ${arrow} ${Math.abs(delta).toFixed(1)}
        </td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1c1917;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#6366F1;font-size:24px;margin:0;">AIRadar Weekly Digest</h1>
    <p style="color:#78716c;margin:4px 0;">Week of ${weekOf}</p>
  </div>

  <h2 style="font-size:18px;margin-bottom:12px;">Top Movers This Week</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f5f5f4;">
        <th style="padding:8px 16px;text-align:left;font-size:14px;">Tool</th>
        <th style="padding:8px 16px;text-align:right;font-size:14px;">Score</th>
        <th style="padding:8px 16px;text-align:right;font-size:14px;">Δ</th>
      </tr>
    </thead>
    <tbody>${moversHtml}</tbody>
  </table>

  <div style="text-align:center;margin-top:32px;">
    <a href="${siteUrl}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
      View Full Leaderboard
    </a>
  </div>

  <p style="color:#a8a29e;font-size:12px;text-align:center;margin-top:32px;">
    You're receiving this because you subscribed to AIRadar.
    <a href="${siteUrl}/api/digest?unsubscribe=true&email=RECIPIENT" style="color:#a8a29e;">Unsubscribe</a>
  </p>
</body>
</html>`;

  // Send to each subscriber (batched)
  const emails = subscribers.map((s) => s.email);
  const batchSize = 50;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((email) =>
        resend.emails.send({
          from: "AIRadar <digest@aidar.dev>",
          to: email,
          subject: `AIRadar Weekly: Top AI Tool Movers – ${weekOf}`,
          html: html.replace("RECIPIENT", encodeURIComponent(email)),
        })
      )
    );
  }
}
