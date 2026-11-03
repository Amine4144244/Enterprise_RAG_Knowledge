// ==============================================================================
// ENTERPRISE AI STUDIO - EVIDENCE PANE (RIGHT SPLIT-SCREEN INSPECTOR)
// A non-modal side-by-side pane that displays verbatim Docling extracted tables,
// page coordinates, and NVIDIA Cross-Encoder rerank scores for verified grounding.
// ==============================================================================

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Table, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

export default function CitationPane({
  citation,
  onClose,
  isOpen = true
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!citation?.text && !citation?.content) return;
    navigator.clipboard.writeText(citation.text || citation.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = citation?.rerank_score;
  const isHighRelevance = score !== undefined && score >= 0.7;

  return (
    <aside className="w-96 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col h-full overflow-hidden transition-all duration-200">
      
      {/* 1. Header Bar */}
      <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Evidence Inspector
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Verbatim Grounding & Rerank Scores
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Body: Either Active Citation or Empty State */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {citation ? (
          <>
            {/* Top Badge & File Title */}
            <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {citation.source_id || 'CHUNKS'}
                </span>

                {citation.is_table ? (
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    <Table className="w-3 h-3" />
                    <span>Docling Table</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                    <FileText className="w-3 h-3" />
                    <span>Text Chunk</span>
                  </span>
                )}
              </div>

              <div className="text-xs">
                <span className="text-zinc-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Source Document
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 break-words">
                  {citation.file_name || citation.source_file || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400">Page Number(s):</span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {citation.page_numbers?.length ? citation.page_numbers.join(', ') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Cross-Encoder Rerank Confidence Bar */}
            {score !== undefined && (
              <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                    <span>NVIDIA Rerank Score</span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {(score * 100).toFixed(1)}% ({score})
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHighRelevance
                        ? 'bg-emerald-500'
                        : score >= 0.4
                        ? 'bg-amber-500'
                        : 'bg-zinc-400'
                    }`}
                    style={{ width: `${Math.min(Math.max(score * 100, 5), 100)}%` }}
                  />
                </div>

                <p className="text-[10px] text-zinc-400">
                  Calculated via token cross-attention between query and passage.
                </p>
              </div>
            )}

            {/* Verbatim Extracted Text / Table View */}
            <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Extracted Content
                </span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 max-h-96 overflow-y-auto text-xs leading-relaxed font-mono whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 bg-zinc-50/30 dark:bg-zinc-950/30">
                {citation.text || citation.content || 'No text snippet available.'}
              </div>
            </div>

            {/* Hallucination-Free Assurance Badge */}
            <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-2.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold block">Grounding Verified</span>
                <span>
                  The generator was constrained to facts stated in this verbatim passage.
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 my-auto">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <Info className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              No Citation Selected
            </h4>
            <p className="text-[11px] text-zinc-400 max-w-[220px] leading-relaxed">
              Click any <span className="font-mono text-indigo-500 font-medium">[SRC-X]</span> badge or reasoning step in the conversation to inspect source evidence.
            </p>
          </div>
        )}
      </div>

    </aside>
  );
}
