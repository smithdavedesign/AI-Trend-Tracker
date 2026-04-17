"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendDataPoint {
  weekOf: string;
  radarScore: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export function TrendChart({ data, height = 200 }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="weekOf"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="radarScore"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ fill: "var(--primary)", r: 3 }}
          name="RadarScore"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
