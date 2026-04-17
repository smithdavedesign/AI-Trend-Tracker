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
}

const CATEGORY_COLORS: Record<string, string> = {
  llm: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  coding: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  agents: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  infra: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  vertical: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

export function ToolCard({
  rank,
  id,
  name,
  category,
  radarScore,
  delta,
  pricingTier,
  selfHostable,
}: ToolCardProps) {
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
