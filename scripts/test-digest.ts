/**
 * Test script: sends a sample digest email directly via Resend.
 * Run with: npx tsx scripts/test-digest.ts
 *
 * Uses onboarding@resend.dev (no domain verification needed) to test delivery.
 */
import { Resend } from "resend";

const TO = process.env.TEST_EMAIL ?? "1426dave@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidar.vercel.app";

const SAMPLE_MOVERS = [
  { name: "Cursor",     score: 87.3, delta: +4.2, id: "cursor" },
  { name: "LangChain",  score: 81.1, delta: +3.1, id: "langchain" },
  { name: "Ollama",     score: 78.5, delta: +2.8, id: "ollama" },
  { name: "DeepSeek",   score: 76.2, delta: +2.3, id: "deepseek" },
  { name: "Groq",       score: 74.9, delta: -1.4, id: "groq" },
];

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error("Missing RESEND_API_KEY"); process.exit(1); }

  const resend = new Resend(apiKey);
  const weekOf = new Date().toISOString().slice(0, 10);

  const moversHtml = SAMPLE_MOVERS.map((t) => {
    const arrow = t.delta >= 0 ? "↑" : "↓";
    const color = t.delta >= 0 ? "#10B981" : "#EF4444";
    return `<tr>
      <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;">
        <a href="${SITE_URL}/tool/${t.id}" style="color:#6366F1;text-decoration:none;">${t.name}</a>
      </td>
      <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${t.score.toFixed(1)}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color};font-weight:600;">${arrow} ${Math.abs(t.delta).toFixed(1)}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1c1917;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#6366F1;font-size:24px;margin:0;">AIRadar Weekly Digest</h1>
    <p style="color:#78716c;margin:4px 0;">Week of ${weekOf} · Test send</p>
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
    <a href="${SITE_URL}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
      View Full Leaderboard
    </a>
  </div>
  <p style="color:#a8a29e;font-size:12px;text-align:center;margin-top:32px;">
    You're receiving this because you subscribed to AIRadar.
    <a href="${SITE_URL}/unsubscribe" style="color:#a8a29e;">Unsubscribe</a>
  </p>
</body>
</html>`;

  console.log(`Sending test digest to ${TO}…`);

  const { data, error } = await resend.emails.send({
    from: "AIRadar <onboarding@resend.dev>",
    to: TO,
    subject: `[TEST] AIRadar Weekly: Top AI Tool Movers – ${weekOf}`,
    html,
  });

  if (error) {
    console.error("Failed:", error);
    process.exit(1);
  }

  console.log(`✓ Sent — message ID: ${data?.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
