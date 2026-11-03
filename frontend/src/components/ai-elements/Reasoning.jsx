// ==============================================================================
// AI ELEMENTS - REASONING ACCORDION (DARK ZINC WORKSPACE)
// Displays chain-of-retrieval steps: Docling Chunker -> Qdrant Hybrid Search
// -> NVIDIA NIM Cross-Encoder Reranking -> XML Grounding.
// ==============================================================================

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  ShieldCheck,
  Table as TableIcon,
  FileText,
  Layers,
  ArrowRight
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
    <div className="my-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden text-xs transition-all">
      
      {/* ==================================================================== */}
      {/* ACCORDION TRIGGER HEADER                                            */}
      {/* ==================================================================== */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-900/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}

          <div className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Retrieval & Grounding Trace</span>
          </div>

          {sources.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
              {sources.length} sources analyzed
            </span>
          )}
        </div>

        {/* Status Hint */}
        <div className="text-[11px] font-mono text-zinc-400">
          {isThinking ? (
            <span className="text-indigo-400 animate-pulse">Evaluating cross-attention...</span>
          ) : (
            <span className="hover:text-zinc-200">{isExpanded ? "Collapse" : "Inspect pipeline"}</span>
          )}
        </div>
      </button>

      {/* ==================================================================== */}
      {/* EXPANDED PIPELINE STAGES                                             */}
      {/* ==================================================================== */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-zinc-800/80 space-y-3">
          
          {/* Stage 1: Docling Hybrid Chunking */}
          <div className="flex items-start gap-2.5 text-[11px]">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20 text-[10px] font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-zinc-200">
                IBM Docling Parser & Hybrid Chunking
              </p>
              <p className="text-zinc-400 leading-snug">
                Extracted tabular layouts into Markdown and tokenized document flow with heading breadcrumbs (512 max tokens).
              </p>
            </div>
          </div>

          {/* Stage 2: Qdrant Hybrid Search */}
          <div className="flex items-start gap-2.5 text-[11px]">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20 text-[10px] font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-zinc-200">
                Qdrant Hybrid Search (Reciprocal Rank Fusion)
              </p>
              <p className="text-zinc-400 leading-snug">
                Combined 1024-dim dense vectors (NVIDIA NV-Embed-QA) with sparse lexical BM25 token frequencies for balanced keyword & semantic recall.
              </p>
            </div>
          </div>

          {/* Stage 3: NVIDIA NIM Cross-Encoder Rerank */}
          <div className="flex items-start gap-2.5 text-[11px]">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20 text-[10px] font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-zinc-200">
                NVIDIA Cross-Encoder Reranker (<code className="text-indigo-300">Mistral-4B-v3</code>)
              </p>
              <p className="text-zinc-400 leading-snug">
                Scored full query-chunk joint attention to isolate precise engineering metrics and eliminate false positives.
              </p>
            </div>
          </div>

          {/* Candidate Chunks Table */}
          {sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block mb-2 font-mono">
                Top Grounding Candidates
              </span>
              <div className="space-y-1.5">
                {sources.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectSource && onSelectSource(src)}
                    className="w-full text-left p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700 flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-indigo-400">
                        {src.source_id || `[${i + 1}]`}
                      </span>
                      {src.is_table ? (
                        <TableIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-zinc-300 truncate group-hover:text-white">
                        {src.file_name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        (p. {src.page_numbers?.join(',')})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        score: {src.rerank_score !== undefined ? Number(src.rerank_score).toFixed(3) : 'N/A'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
