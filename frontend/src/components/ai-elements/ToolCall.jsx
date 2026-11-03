// ==============================================================================
// AI ELEMENTS - TOOL CALL COMPONENT (DARK / LIGHT ZINC WORKSPACE)
// Renders agentic pipeline tool execution (e.g. Qdrant Hybrid Search)
// Displays active streaming spinner or completed chunk count.
// Fully supports dual light and dark modes with high legibility.
// ==============================================================================

import React from 'react';
import { Database, CheckCircle2, Loader2 } from 'lucide-react';

export function ToolCall({
  toolName = "hybrid_search",
  status = "completed", // "running" | "completed"
  args = {},
  resultCount = 0
}) {
  const isRunning = status === "running";

  return (
    <div className="my-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-mono transition-colors duration-150 shadow-sm">
      
      {/* Tool Identifier */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 shadow-sm">
          <Database className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{toolName}</span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">(qdrant, dense+sparse)</span>
        </div>
      </div>

      {/* Execution Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
        {isRunning ? (
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Retrieving & reranking...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resultCount} chunks retrieved</span>
          </span>
        )}
      </div>

    </div>
  );
}
