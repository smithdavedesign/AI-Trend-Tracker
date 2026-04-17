import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from AIRadar weekly digest emails.",
};

export default async function UnsubscribePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ success?: string; error?: string }> }>) {
  const { success, error } = await searchParams;

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">Unsubscribed</h1>
        <p className="text-muted mb-6">
          You have been removed from the AIRadar weekly digest.
        </p>
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Back to AIRadar
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">Invalid link</h1>
        <p className="text-muted mb-6">
          This unsubscribe link is invalid or has expired. Please contact us if
          you continue to receive emails.
        </p>
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Back to AIRadar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold mb-3">Unsubscribe</h1>
      <p className="text-muted">
        Use the unsubscribe link in your digest email to unsubscribe.
      </p>
    </div>
  );
}
