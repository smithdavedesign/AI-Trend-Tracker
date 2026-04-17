"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Tool {
  id: string;
  name: string;
  category: string;
  radarScore: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  coding: "Coding",
  agents: "Agents",
  infra: "Infrastructure",
  vertical: "Vertical",
};

export function CompareToolSelect({
  label,
  tools,
  paramName,
  selected,
  otherSelected,
}: Readonly<{
  label: string;
  tools: Tool[];
  paramName: "a" | "b";
  selected: string | undefined;
  otherSelected: string | undefined;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const grouped = tools.reduce<Record<string, Tool[]>>((acc, tool) => {
    const cat = tool.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    if (otherSelected) {
      const other = paramName === "a" ? "b" : "a";
      params.set(other, otherSelected);
    }
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={`picker-${paramName}`}>
        {label}
      </label>
      <select
        id={`picker-${paramName}`}
        value={selected ?? ""}
        onChange={handleChange}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">— Select a tool —</option>
        {Object.entries(grouped).map(([cat, catTools]) => (
          <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
            {catTools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name} ({Number(tool.radarScore ?? 0).toFixed(0)})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
