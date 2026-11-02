// ==============================================================================
// CITATION INSPECTOR DRAWER
// Slides in from the right to display the exact PDF page, section breadcrumbs,
// reranker score, and verbatim text/tables behind any cited claim.
// ==============================================================================

import React, { useEffect } from 'react';
import { X, FileText, CheckCircle2, Table, Hash, ExternalLink } from 'lucide-react';

export default function CitationInspector({ citation, onClose }) {
  // Close drawer when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* BLOCK 1: Translucent Dimming Scrim (Click to dismiss) */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* BLOCK 2: Apple Spring Sheet Panel */}
      <div className="relative w-full max-w-lg h-full glass-material bg-white/95 dark:bg-[#1c1c1e]/95 shadow-apple-lg border-l border-black/[0.08] dark:border-white/[0.1] flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Citation Details
              </h2>
              <p className="text-xs text-[#86868b]">
                {citation.source_id} • Verified Attribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="apple-button p-2 rounded-xl text-[#86868b] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            aria-label="Close citation details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Metadata Card */}
          <div className="rounded-xl p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] space-y-2 text-xs">
            
            {/* File & Page */}
            <div className="flex items-center justify-between">
              <span className="text-[#86868b]">Document:</span>
              <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate max-w-[240px]">
                {citation.file_name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#86868b]">Page Number(s):</span>
              <span className="font-semibold text-[#0071e3]">
                {citation.page_numbers?.length ? citation.page_numbers.join(', ') : 'N/A'}
              </span>
            </div>

            {/* Reranker Confidence */}
            {citation.rerank_score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[#86868b]">Cross-Encoder Score:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium">
                  {citation.rerank_score}
                </span>
              </div>
            )}

            {/* Element Type */}
            <div className="flex items-center justify-between">
              <span className="text-[#86868b]">Data Type:</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                {citation.is_table ? (
                  <>
                    <Table className="w-3.5 h-3.5 text-blue-500" />
                    <span>Structured Table</span>
                  </>
                ) : (
                  <span>Text / Spec Section</span>
                )}
              </span>
            </div>

            {/* Heading Hierarchy */}
            {citation.section_headings && citation.section_headings.length > 0 && (
              <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[#86868b] block mb-1">Section Path:</span>
                <p className="text-[11px] font-mono text-[#515154] dark:text-[#a1a1a6] bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded-md">
                  {citation.section_headings.join(' > ')}
                </p>
              </div>
            )}
          </div>

          {/* Verbatim Source Snippet */}
          <div>
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
              Verbatim Extracted Chunk
            </h3>
            <div className="rounded-xl p-4 bg-white dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.1] shadow-apple-sm text-xs leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto text-[#1d1d1f] dark:text-[#f5f5f7]">
              {citation.text}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between text-xs text-[#86868b]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Extracted via IBM Docling Layout</span>
          </div>
          <button
            onClick={onClose}
            className="apple-button px-3 py-1.5 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0077ed]"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
