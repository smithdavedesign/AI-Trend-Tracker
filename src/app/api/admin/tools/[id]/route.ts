import { getDb } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

async function isAuthed(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const jar = await cookies();
  return jar.get("admin_auth")?.value === adminPassword;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { isDead?: boolean; deadSince?: string | null };

  const db = getDb();
  await db
    .update(tools)
    .set({
      isDead: body.isDead ?? false,
      deadSince: body.isDead
        ? (body.deadSince ? new Date(body.deadSince) : new Date())
        : null,
    })
    .where(eq(tools.id, id));

  return Response.json({ ok: true });
}
