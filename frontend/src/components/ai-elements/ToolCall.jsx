// ==============================================================================
// AI ELEMENTS - TOOL CALL COMPONENT
// Represents an agentic retrieval tool execution (e.g. Qdrant Hybrid Search).
// ==============================================================================

import React from 'react';
import { Database, CheckCircle2, Loader2 } from 'lucide-react';

export function ToolCall({
  toolName = "qdrant_hybrid_search",
  status = "completed", // "running" | "completed"
  args = {},
  resultCount = 0
}) {
  return (
    <div className="my-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-2 text-xs">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Database className="w-3 h-3" />
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {toolName}
          </span>
          {args.query && (
            <span className="text-zinc-500 truncate max-w-[200px] sm:max-w-[320px] font-mono text-[11px]">
              "{args.query}"
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {status === "running" ? (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Searching Qdrant...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>{resultCount} chunks retrieved</span>
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
