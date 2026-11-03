// ==============================================================================
// AI ELEMENTS - TOOL CALL COMPONENT (DARK ZINC WORKSPACE)
// Renders agentic pipeline tool execution (e.g. Qdrant Hybrid Search)
// Displays active streaming spinner or completed chunk count.
// ==============================================================================

import React from 'react';
import { Database, CheckCircle2, Loader2, Cpu } from 'lucide-react';

export function ToolCall({
  toolName = "hybrid_search",
  status = "completed", // "running" | "completed"
  args = {},
  resultCount = 0
}) {
  const isRunning = status === "running";

  return (
    <div className="my-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs font-mono transition-all">
      
      {/* Tool Identifier */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <Database className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-zinc-200 font-medium">{toolName}</span>
          <span className="text-zinc-400 text-[11px]">(qdrant, dense+sparse)</span>
        </div>
      </div>

      {/* Execution Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
        {isRunning ? (
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Retrieving & reranking...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>{resultCount} chunks retrieved</span>
          </span>
        )}
      </div>

    </div>
  );
}
