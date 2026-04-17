interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-secondary";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-accent";
  return "text-danger";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-secondary/10";
  if (score >= 60) return "bg-primary/10";
  if (score >= 40) return "bg-accent/10";
  return "bg-danger/10";
}

export function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} ${getScoreBg(score)} ${getScoreColor(score)} rounded-full flex items-center justify-center font-bold`}
      >
        {score.toFixed(0)}
      </div>
      {showLabel && (
        <span className="text-xs text-muted">RadarScore</span>
      )}
    </div>
  );
}

interface DeltaBadgeProps {
  delta: number | null;
}

export function DeltaBadge({ delta }: DeltaBadgeProps) {
  if (delta === null || delta === undefined) {
    return <span className="text-xs text-muted">NEW</span>;
  }

  if (Math.abs(delta) < 0.1) {
    return <span className="text-xs text-muted">—</span>;
  }

  const isPositive = delta > 0;
  return (
    <span
      className={`text-xs font-medium ${isPositive ? "text-secondary" : "text-danger"}`}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}
    </span>
  );
}
