// ==============================================================================
// AI ELEMENTS - TOOL CALL COMPONENT
// Represents an agentic tool execution (e.g. hybrid_search in Qdrant)
// Shows the status (running vs completed) and arguments cleanly.
// ==============================================================================

import React from 'react';
import { Search, Database, CheckCircle2, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';

export function ToolCall({
  toolName = "hybrid_search",
  status = "completed", // "running" | "completed"
  args = {},
  resultCount = 0
}) {
  return (
    <div className="my-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 text-xs transition-all">
      
      {/* BLOCK 1: Tool Header with Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3] dark:text-[#42a5f5]">
            <Database className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
            {toolName}
          </span>
          {args.query && (
            <span className="text-[#86868b] truncate max-w-[200px] sm:max-w-[320px]">
              "{args.query}"
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {status === "running" ? (
            <span className="flex items-center gap-1 text-[#0071e3] dark:text-[#42a5f5] font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Retrieving...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>{resultCount} chunks retrieved & reranked</span>
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
