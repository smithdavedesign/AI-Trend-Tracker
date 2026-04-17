"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeadTool {
  id: string;
  name: string;
  category: string;
  deadSince: Date | null;
}

export function DeadToolRow({ tool }: Readonly<{ tool: DeadTool }>) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function restore() {
    setLoading(true);
    await fetch(`/api/admin/tools/${tool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDead: false }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3 font-medium">{tool.name}</td>
      <td className="p-3 capitalize text-muted">{tool.category}</td>
      <td className="p-3 text-muted">
        {tool.deadSince ? new Date(tool.deadSince).toLocaleDateString() : "—"}
      </td>
      <td className="p-3 text-right">
        <button
          onClick={restore}
          disabled={loading}
          className="rounded-lg border border-border px-3 py-1 text-xs hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
        >
          {loading ? "Restoring…" : "Mark Live"}
        </button>
      </td>
    </tr>
  );
}
