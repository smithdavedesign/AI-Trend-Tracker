import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "/";

  revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    path,
    now: Date.now(),
  });
}
