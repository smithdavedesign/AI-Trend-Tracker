"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ToolEntry {
  id: string;
  name: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  coding: "Coding",
  agents: "Agents",
  infra: "Infra",
  vertical: "Vertical",
};

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openPalette = useCallback(() => {
    setOpen(true);
    if (tools.length === 0) {
      fetch("/api/tools")
        .then((r) => r.json())
        .then((data: ToolEntry[]) => setTools(data))
        .catch(() => null);
    }
  }, [tools.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = query.trim()
    ? tools.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase())
      )
    : tools.slice(0, 8);

  function navigate(id: string) {
    setOpen(false);
    router.push(`/tool/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      navigate(results[activeIndex].id);
    }
  }

  return (
    <>
      <button
        onClick={openPalette}
        aria-label="Search tools"
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted hover:border-primary/40 hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="hidden sm:inline">Search tools</span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 text-muted">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search AI tools..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <kbd
                onClick={() => setOpen(false)}
                className="cursor-pointer hidden sm:inline-flex h-5 items-center rounded border border-border px-1 text-[10px] font-mono text-muted"
              >
                Esc
              </kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted">No tools found</li>
              ) : (
                results.map((tool, i) => (
                  <li key={tool.id}>
                    <button
                      onClick={() => navigate(tool.id)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                        i === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/10"
                      }`}
                    >
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-xs text-muted">{CATEGORY_LABELS[tool.category] ?? tool.category}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {!query && (
              <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
                Type to search · ↑↓ navigate · Enter to open
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
