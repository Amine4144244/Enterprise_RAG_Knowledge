// ==============================================================================
// CITATION INSPECTOR COMPONENT (GROUNDING AUDIT DRAWER)
// High-density side panel displaying exact chunk provenance, Docling table
// extractions, page numbers, and cross-encoder attention scores.
// ==============================================================================

import React, { useState } from 'react';
import {
  X,
  FileText,
  Table as TableIcon,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Hash,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function CitationInspector({
  citation,
  onClose
}) {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const score = citation.rerank_score !== undefined ? citation.rerank_score : citation.score;
  const isTable = citation.is_table;
  const pageNumbers = citation.page_numbers || [];
  const headings = citation.headings || [];

  const handleCopyText = () => {
    if (!citation.text) return;
    navigator.clipboard.writeText(citation.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Confidence color & label
  const getConfidenceBadge = (val) => {
    if (val === undefined || val === null) return null;
    const num = Number(val);
    if (num >= 0.7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
          High Confidence ({num.toFixed(3)})
        </span>
      );
    }
    if (num >= 0.4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px]">
          Medium Confidence ({num.toFixed(3)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[11px]">
        Low Confidence ({num.toFixed(3)})
      </span>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950 border-l border-zinc-800 z-40 flex flex-col shadow-2xl shadow-black animate-in slide-in-from-right duration-200">
      
      {/* ==================================================================== */}
      {/* HEADER: Title & Close Button                                         */}
      {/* ==================================================================== */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
            {isTable ? <TableIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-semibold text-zinc-100">
                {citation.source_id || 'PROVENANCE'}
              </span>
              {isTable && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/20">
                  Table Layout
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
              {citation.file_name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Close Inspector (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* BODY: Metrics, Breadcrumbs & Text View                               */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          {/* Document Pages */}
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Source Location
            </span>
            <div className="font-mono text-zinc-200 text-xs flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Page {pageNumbers.length > 0 ? pageNumbers.join(', ') : '1'}</span>
            </div>
          </div>

          {/* Rerank Metric */}
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Cross-Encoder
            </span>
            <div>
              {getConfidenceBadge(score)}
            </div>
          </div>

        </div>

        {/* Heading Hierarchy Trail */}
        {headings && headings.length > 0 && (
          <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/70 text-xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Document Hierarchy Trail
            </span>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-300">
              {headings.map((h, i) => (
                <React.Fragment key={i}>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono">
                    {h}
                  </span>
                  {i < headings.length - 1 && (
                    <span className="text-zinc-400">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Grounding Passage Text / Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">
              Extracted Grounding Text
            </span>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy Passage</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto selection:bg-indigo-500/30 selection:text-white">
            {citation.text || '(No text content available for this chunk)'}
          </div>
        </div>

        {/* Verification Architecture Footer Note */}
        <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Hallucination Guardrail</span>
          </div>
          <p className="leading-snug">
            Extracted via IBM Docling Document Converter. Verified through NVIDIA NIM Cross-Encoder token cross-attention before synthesis.
          </p>
        </div>

      </div>

    </div>
  );
}
