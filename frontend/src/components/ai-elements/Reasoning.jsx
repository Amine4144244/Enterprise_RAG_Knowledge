// ==============================================================================
// AI ELEMENTS - REASONING ACCORDION
// Multi-stage retrieval & rerank pipeline trace for grounded transparency.
// ==============================================================================

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';

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
    <div className="my-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 overflow-hidden text-xs">
      
      {/* 1. Header Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}

          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Reasoning & Hybrid Retrieval Trace</span>
          </div>

          {sources.length > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {sources.length} sources evaluated
            </span>
          )}
        </div>

        {/* Status Indicator */}
        <div className="text-[11px] text-zinc-400">
          {isThinking ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
              Evaluating grounding evidence...
            </span>
          ) : (
            <span>{isExpanded ? "Hide" : "Inspect pipeline"}</span>
          )}
        </div>
      </button>

      {/* 2. Expanded Content */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
          
          {/* Stage 1: Dual Vector Embedding & RRF */}
          <div className="flex items-start gap-2 text-[11px]">
            <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
              1
            </div>
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                Dual-Vector Ingestion & Reciprocal Rank Fusion (RRF)
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Queried NVIDIA NV-Embed-QA (dense semantic) and FastEmbed BM25 (sparse lexical) simultaneously in Qdrant with RRF coefficient k=60.
              </p>
            </div>
          </div>

          {/* Stage 2: Cross-Encoder Rerank */}
          <div className="flex items-start gap-2 text-[11px]">
            <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
              2
            </div>
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                NVIDIA NIM NeMo Cross-Encoder Reranking
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Cross-attended query against top candidate passages to calculate precise factual relevance scores and filter noise.
              </p>
            </div>
          </div>

          {/* Stage 3: Candidate Source List */}
          {sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block mb-1.5">
                Top Reranked Candidate Chunks
              </span>
              <div className="space-y-1">
                {sources.map((chunk, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectSource && onSelectSource(chunk)}
                    className="p-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer flex items-center justify-between text-[11px] transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[340px]">
                        {chunk.source_file || chunk.file_name}
                      </span>
                      <span className="text-zinc-400 font-mono text-[10px]">
                        p. {chunk.page_numbers?.join(',')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {chunk.rerank_score !== undefined && (
                        <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {(chunk.rerank_score * 100).toFixed(0)}%
                        </span>
                      )}
                      <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
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
