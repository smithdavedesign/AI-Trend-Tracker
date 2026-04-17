import { getDb } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({ id: tools.id, name: tools.name, category: tools.category })
    .from(tools)
    .orderBy(asc(tools.name));

  return Response.json(rows, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
