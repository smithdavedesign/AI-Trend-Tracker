"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORT_OPTIONS = [
  { value: "radar_score", label: "RadarScore" },
  { value: "name", label: "Name" },
  { value: "adoption", label: "Adoption" },
  { value: "recency", label: "Recency" },
] as const;

export function SortControls({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "radar_score") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted">Sort:</span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSort(opt.value)}
          className={`rounded-full px-3 py-1 text-sm border transition-colors ${
            currentSort === opt.value
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border hover:border-primary/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
