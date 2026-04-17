"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tool {
  id: string;
  name: string;
}

const DIMS = [
  { key: "adoptionMomentum",    label: "Adoption Momentum" },
  { key: "developerSentiment",  label: "Developer Sentiment" },
  { key: "enterpriseReadiness", label: "Enterprise Readiness" },
  { key: "recency",             label: "Recency" },
  { key: "buzz",                label: "Buzz" },
] as const;

type DimKey = typeof DIMS[number]["key"];

export function ScoreOverridePanel({ tools }: Readonly<{ tools: Tool[] }>) {
  const [selectedId, setSelectedId] = useState("");
  const [scores, setScores] = useState<Record<DimKey, number>>({
    adoptionMomentum: 50,
    developerSentiment: 50,
    enterpriseReadiness: 50,
    recency: 50,
    buzz: 50,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/admin/tools/${selectedId}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scores),
    });

    const data = await res.json() as { ok?: boolean; radarScore?: number; error?: string };
    setLoading(false);

    if (data.ok) {
      setResult(`Score set to ${(data.radarScore ?? 0).toFixed(1)}`);
      router.refresh();
    } else {
      setResult(`Error: ${data.error ?? "unknown"}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="override-tool">Tool</label>
        <select
          id="override-tool"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">— Select tool —</option>
          {tools.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DIMS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium mb-1" htmlFor={`dim-${key}`}>
              {label} <span className="text-muted">({scores[key]})</span>
            </label>
            <input
              id={`dim-${key}`}
              type="range"
              min={0}
              max={100}
              value={scores[key]}
              onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !selectedId}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Apply Override"}
        </button>
        {result && <span className="text-sm text-muted">{result}</span>}
      </div>
    </form>
  );
}
