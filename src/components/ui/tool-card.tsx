import Link from "next/link";
import { ScoreBadge, DeltaBadge } from "@/components/ui/score-badge";

interface ToolCardProps {
  rank?: number;
  id: string;
  name: string;
  category: string;
  radarScore: number;
  delta: number | null;
  pricingTier: string;
  selfHostable: boolean;
  sparkline?: number[];
}

const CATEGORY_COLORS: Record<string, string> = {
  llm: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  coding: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  agents: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  infra: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  vertical: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function Sparkline({ values }: Readonly<{ values: number[] }>) {
  if (values.length < 2) return null;

  const W = 56;
  const H = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });

  const trending = (values.at(-1) ?? 0) >= values[0];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 hidden sm:block"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={trending ? "var(--color-secondary, #16a34a)" : "var(--color-danger, #dc2626)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToolCard({
  rank,
  id,
  name,
  category,
  radarScore,
  delta,
  pricingTier,
  selfHostable,
  sparkline,
}: Readonly<ToolCardProps>) {
  return (
    <Link
      href={`/tool/${id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
    >
      {rank !== undefined && (
        <span className="w-8 text-center text-lg font-bold text-muted">
          {rank}
        </span>
      )}

      <ScoreBadge score={radarScore} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
          <DeltaBadge delta={delta} />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[category] ?? "bg-stone-100 text-stone-700"}`}
          >
            {category}
          </span>
          <span className="text-xs text-muted capitalize">{pricingTier}</span>
          {selfHostable && (
            <span className="text-xs text-secondary">Self-hosted</span>
          )}
        </div>
      </div>

      {sparkline && sparkline.length >= 2 && (
        <Sparkline values={sparkline} />
      )}

      <svg
        className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
