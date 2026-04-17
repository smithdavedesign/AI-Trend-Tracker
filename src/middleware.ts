import { NextRequest, NextResponse } from "next/server";

// In-memory sliding window rate limiter (per-instance; good enough for low-traffic hobby projects)
const rateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/subscribe":      { limit: 5,  windowMs: 60_000 },
  "/api/unsubscribe":    { limit: 5,  windowMs: 60_000 },
  "/api/admin/login":    { limit: 10, windowMs: 60_000 },
  "/api/digest":         { limit: 3,  windowMs: 60_000 },
};

function checkRateLimit(ip: string, pathname: string): boolean {
  const rule = RATE_LIMITS[pathname];
  if (!rule) return true;

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > rule.limit) return false;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = req.cookies.get("admin_auth")?.value;

    if (!adminPassword || cookie !== adminPassword) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rate limiting on sensitive API routes
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip, pathname)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/subscribe", "/api/unsubscribe", "/api/admin/:path*", "/api/digest"],
};
