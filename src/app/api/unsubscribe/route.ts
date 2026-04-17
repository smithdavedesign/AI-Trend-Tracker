import { getDb } from "@/lib/db";
import { digestSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(
      new URL("/unsubscribe?error=invalid", req.nextUrl.origin)
    );
  }

  const db = getDb();
  await db
    .update(digestSubscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(digestSubscribers.email, email));

  return NextResponse.redirect(
    new URL("/unsubscribe?success=1", req.nextUrl.origin)
  );
}
