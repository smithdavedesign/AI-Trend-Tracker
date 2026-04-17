import { getDb } from "@/lib/db";
import { digestSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const unsubscribe = searchParams.get("unsubscribe");

  if (unsubscribe === "true" && email) {
    const db = getDb();
    await db
      .update(digestSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(digestSubscribers.email, email));

    return new NextResponse(
      `<html><body style="font-family:system-ui;text-align:center;padding:40px;"><h2>Unsubscribed</h2><p>You've been removed from the AIRadar weekly digest.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
