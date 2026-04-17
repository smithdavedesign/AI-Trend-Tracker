import { createHmac } from "crypto";

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? process.env.REVALIDATION_SECRET ?? "aidar-fallback-secret";
}

export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  // Constant-time comparison
  if (expected.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}
