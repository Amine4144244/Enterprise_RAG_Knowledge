// ==============================================================================
// AI ELEMENTS - REASONING & RETRIEVAL INSPECTOR COMPONENT
// Collapsible thinking / reasoning accordion showing the agent's multi-stage
// retrieval pipeline: Hybrid Search -> Cross-Encoder Rerank -> Citation Binding.
// ==============================================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Layers, Sparkles, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export function Reasoning({
  sources = [],
  isThinking = false,
  onSelectSource,
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!sources || sources.length === 0) {
    if (!isThinking) return null;
  }

  return (
    <div className="my-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] overflow-hidden text-xs transition-all">
      
      {/* BLOCK 1: Accordion Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#86868b]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
          )}

          <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
            <Cpu className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Retrieval & Grounding Reasoning</span>
          </div>

          {sources.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[10px] text-[#86868b]">
              {sources.length} sources analyzed
            </span>
          )}
        </div>

        {/* Status Pill */}
        <div className="text-[11px] text-[#86868b]">
          {isThinking ? (
            <span className="inline-flex items-center gap-1 text-[#0071e3] font-medium animate-pulse">
              <span>Evaluating evidence...</span>
            </span>
          ) : (
            <span className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]">
              {isExpanded ? "Collapse" : "Inspect pipeline"}
            </span>
          )}
        </div>
      </button>

      {/* BLOCK 2: Expanded Content (Multi-Stage Pipeline Trace) */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-black/[0.04] dark:border-white/[0.04] space-y-2.5">
          
          {/* Step 1: Hybrid Search Details */}
          <div className="flex items-start gap-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                Stage 1: Qdrant Hybrid Search (Dense NV-Embed-QA + Sparse BM25)
              </p>
              <p className="text-[#86868b]">
                Executed server-side Reciprocal Rank Fusion (RRF) across semantic vector space and lexical keyword inverted index.
              </p>
            </div>
          </div>

          {/* Step 2: Cross-Encoder Details */}
          <div className="flex items-start gap-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                Stage 2: NVIDIA NIM Cross-Encoder Reranker (Mistral-4B-v3)
              </p>
              <p className="text-[#86868b]">
                Evaluated query-passage token cross-attention to isolate exact numerical metrics and tabular relational boundaries.
              </p>
            </div>
          </div>

          {/* Step 3: Candidate Chunks List */}
          {sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider block mb-1.5">
                Top Reranked Candidate Chunks
              </span>
              <div className="space-y-1.5">
                {sources.map((chunk, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectSource && onSelectSource(chunk)}
                    className="p-2 rounded-lg bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.06] hover:border-[#0071e3]/40 cursor-pointer flex items-center justify-between text-[11px] transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#0071e3] flex-shrink-0" />
                      <span className="font-medium truncate max-w-[180px] sm:max-w-[280px]">
                        {chunk.source_file || chunk.file_name}
                      </span>
                      <span className="text-[#86868b]">
                        (p. {chunk.page_numbers?.join(',')})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {chunk.rerank_score !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-medium ${
                          chunk.rerank_score >= 0.7 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : chunk.rerank_score >= 0.4
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          Score: {chunk.rerank_score}
                        </span>
                      )}
                      <ArrowRight className="w-3 h-3 text-[#86868b] group-hover:text-[#0071e3] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
