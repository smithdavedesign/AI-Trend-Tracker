import { getDb } from "@/lib/db";
import { digestSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email");

  const result = SubscribeSchema.safeParse({ email });
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    await db
      .insert(digestSubscribers)
      .values({ email: result.data.email })
      .onConflictDoUpdate({
        target: digestSubscribers.email,
        set: { unsubscribedAt: null },
      });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }

  // Redirect back with success
  const referer = request.headers.get("referer") ?? "/";
  return NextResponse.redirect(new URL(`${referer}#subscribed`), 303);
}
