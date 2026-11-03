// ==============================================================================
// AI ELEMENTS - CITATION BADGE COMPONENT
// Renders an interactive, verified citation pill with confidence indicators
// and tactile hover states.
// ==============================================================================

import React from 'react';
import { FileText, ExternalLink, Check } from 'lucide-react';

export function CitationBadge({
  sourceId,
  citation,
  onClick
}) {
  const score = citation?.rerank_score;
  const pageStr = citation?.page_numbers ? citation.page_numbers.join(', ') : '?';
  const label = citation 
    ? `${sourceId} • p. ${pageStr}`
    : sourceId;

  // Confidence color-coding based on cross-encoder rerank score
  const getBadgeStyle = () => {
    if (score >= 0.7) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";
    }
    if (score >= 0.4) {
      return "bg-[#0071e3]/10 text-[#0071e3] dark:text-[#42a5f5] border-[#0071e3]/20 hover:bg-[#0071e3]/20";
    }
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20";
  };

  return (
    <button
      onClick={() => onClick && onClick(citation)}
      className={`apple-button inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border align-baseline cursor-pointer transition-all ${getBadgeStyle()}`}
      title={citation ? `${citation.file_name} • Score: ${score || 'N/A'}` : 'View Citation'}
    >
      <FileText className="w-3 h-3 flex-shrink-0" />
      <span>{label}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-75 font-mono ml-0.5">
          ({score})
        </span>
      )}
    </button>
  );
}
