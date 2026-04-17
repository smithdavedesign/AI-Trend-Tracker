import { getDb } from "@/lib/db";
import { tools, comparisons } from "@/lib/db/schema";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { RadarScoreChart } from "@/components/charts/radar-score-chart";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { SubScores } from "@/lib/schemas";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare AI Tools",
  description: "Side-by-side comparison of AI tools across 5 scoring dimensions.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const db = getDb();

  // Fetch all tools for picker
  const allTools = await db
    .select({
      id: tools.id,
      name: tools.name,
      category: tools.category,
      radarScore: tools.radarScore,
    })
    .from(tools)
    .orderBy(asc(tools.name));

  // If both tools selected, fetch full data
  let toolA = null;
  let toolB = null;
  let comparison = null;

  if (a) {
    const [row] = await db.select().from(tools).where(eq(tools.id, a)).limit(1);
    toolA = row ?? null;
  }
  if (b) {
    const [row] = await db.select().from(tools).where(eq(tools.id, b)).limit(1);
    toolB = row ?? null;
  }

  if (toolA && toolB) {
    const [row] = await db
      .select()
      .from(comparisons)
      .where(
        or(
          and(eq(comparisons.toolAId, a!), eq(comparisons.toolBId, b!)),
          and(eq(comparisons.toolAId, b!), eq(comparisons.toolBId, a!))
        )
      )
      .orderBy(desc(comparisons.weekOf))
      .limit(1);
    comparison = row ?? null;
  }

  const subScoresA = (toolA?.subScores as SubScores) ?? {
    adoptionMomentum: 0,
    developerSentiment: 0,
    enterpriseReadiness: 0,
    recency: 0,
    buzz: 0,
  };
  const subScoresB = (toolB?.subScores as SubScores) ?? {
    adoptionMomentum: 0,
    developerSentiment: 0,
    enterpriseReadiness: 0,
    recency: 0,
    buzz: 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Compare AI Tools</h1>

      {/* Tool pickers */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ToolPicker
          label="Tool A"
          tools={allTools ?? []}
          selected={a}
          otherSelected={b}
          paramName="a"
        />
        <ToolPicker
          label="Tool B"
          tools={allTools ?? []}
          selected={b}
          otherSelected={a}
          paramName="b"
        />
      </div>

      {toolA && toolB ? (
        <>
          {/* Score comparison */}
          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-2">{toolA.name}</h3>
              <ScoreBadge score={Number(toolA.radarScore)} size="lg" showLabel />
              <span className="mt-2 text-xs text-muted capitalize">{toolA.category} · {toolA.pricingTier}</span>
            </div>

            <div className="flex items-center justify-center text-2xl font-bold text-muted">
              vs
            </div>

            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-2">{toolB.name}</h3>
              <ScoreBadge score={Number(toolB.radarScore)} size="lg" showLabel />
              <span className="mt-2 text-xs text-muted capitalize">{toolB.category} · {toolB.pricingTier}</span>
            </div>
          </div>

          {/* Radar overlay */}
          <div className="rounded-xl border border-border bg-card p-4 mb-8">
            <h2 className="font-semibold mb-2">Dimension Comparison</h2>
            <RadarScoreChart
              subScores={subScoresA}
              comparisonScores={subScoresB}
              toolName={toolA.name}
              comparisonName={toolB.name}
            />
          </div>

          {/* Dimension breakdown table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left p-3 font-medium">Dimension</th>
                  <th className="text-right p-3 font-medium">{toolA.name}</th>
                  <th className="text-right p-3 font-medium">{toolB.name}</th>
                  <th className="text-center p-3 font-medium">Winner</th>
                </tr>
              </thead>
              <tbody>
                {(["adoptionMomentum", "developerSentiment", "enterpriseReadiness", "recency", "buzz"] as const).map(
                  (dim) => {
                    const valA = subScoresA[dim] ?? 0;
                    const valB = subScoresB[dim] ?? 0;
                    const winner = valA > valB ? toolA.name : valB > valA ? toolB.name : "Tie";
                    return (
                      <tr key={dim} className="border-b border-border last:border-0">
                        <td className="p-3 capitalize">
                          {dim.replace(/([A-Z])/g, " $1").trim()}
                        </td>
                        <td className={`p-3 text-right font-medium ${valA >= valB ? "text-primary" : ""}`}>
                          {valA.toFixed(1)}
                        </td>
                        <td className={`p-3 text-right font-medium ${valB >= valA ? "text-secondary" : ""}`}>
                          {valB.toFixed(1)}
                        </td>
                        <td className="p-3 text-center text-xs">
                          {winner}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* AI comparison blurb */}
          {comparison && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="font-semibold mb-2">🤖 AI Analysis</h3>
              <p className="text-sm text-foreground">{comparison.comparisonBlurb}</p>
              <p className="mt-2 text-xs text-muted">
                Generated {comparison.generatedAt ? new Date(comparison.generatedAt).toLocaleDateString() : ""} · Week of {comparison.weekOf}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted">
          <p className="text-lg">Select two tools above to compare them.</p>
          <p className="text-sm mt-2">
            Compare RadarScores, sub-dimensions, and AI-generated analysis.
          </p>
        </div>
      )}
    </div>
  );
}

function ToolPicker({
  label,
  tools,
  selected,
  otherSelected,
  paramName,
}: {
  label: string;
  tools: Array<{ id: string; name: string; category: string; radarScore: string | null }>;  
  selected?: string;
  otherSelected?: string;
  paramName: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => {
          const isSelected = tool.id === selected;
          const otherParam = paramName === "a" ? "b" : "a";
          const href = otherSelected
            ? `/compare?${paramName}=${tool.id}&${otherParam}=${otherSelected}`
            : `/compare?${paramName}=${tool.id}`;

          return (
            <Link
              key={tool.id}
              href={href}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {tool.name}
              <span className="ml-1 text-xs text-muted">{Number(tool.radarScore ?? 0).toFixed(0)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
