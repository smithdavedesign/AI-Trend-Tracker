import { getDb } from "@/lib/db";
import { tools, scores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

async function isAuthed(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const jar = await cookies();
  return jar.get("admin_auth")?.value === adminPassword;
}

const OverrideSchema = z.object({
  adoptionMomentum:    z.number().min(0).max(100),
  developerSentiment:  z.number().min(0).max(100),
  enterpriseReadiness: z.number().min(0).max(100),
  recency:             z.number().min(0).max(100),
  buzz:                z.number().min(0).max(100),
});

function currentWeekOf(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = OverrideSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid scores" }, { status: 400 });
  }

  const sub = parsed.data;
  const radarScore =
    (sub.adoptionMomentum + sub.developerSentiment + sub.enterpriseReadiness + sub.recency + sub.buzz) / 5;
  const weekOf = currentWeekOf();
  const db = getDb();

  await db.insert(scores).values({
    toolId: id,
    radarScore: String(Math.round(radarScore * 100) / 100),
    adoptionMomentum: String(sub.adoptionMomentum),
    developerSentiment: String(sub.developerSentiment),
    enterpriseReadiness: String(sub.enterpriseReadiness),
    recency: String(sub.recency),
    buzz: String(sub.buzz),
    weekOf,
    previousRadarScore: null,
    delta: null,
  });

  await db
    .update(tools)
    .set({
      radarScore: String(Math.round(radarScore * 100) / 100),
      subScores: sub,
      lastUpdated: new Date(),
    })
    .where(eq(tools.id, id));

  return Response.json({ ok: true, radarScore });
}
