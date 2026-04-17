"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SubScores {
  adoptionMomentum: number;
  developerSentiment: number;
  enterpriseReadiness: number;
  recency: number;
  buzz: number;
}

interface RadarScoreChartProps {
  subScores: SubScores;
  comparisonScores?: SubScores;
  toolName?: string;
  comparisonName?: string;
}

const DIMENSION_LABELS: Record<keyof SubScores, string> = {
  adoptionMomentum: "Adoption",
  developerSentiment: "Sentiment",
  enterpriseReadiness: "Enterprise",
  recency: "Recency",
  buzz: "Buzz",
};

export function RadarScoreChart({
  subScores,
  comparisonScores,
  toolName = "Tool",
  comparisonName = "Comparison",
}: RadarScoreChartProps) {
  const data = Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
    dimension: label,
    value: subScores[key as keyof SubScores],
    ...(comparisonScores
      ? { comparison: comparisonScores[key as keyof SubScores] }
      : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 10 }}
        />
        <Radar
          name={toolName}
          dataKey="value"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {comparisonScores && (
          <Radar
            name={comparisonName}
            dataKey="comparison"
            stroke="var(--secondary)"
            fill="var(--secondary)"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        )}
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
