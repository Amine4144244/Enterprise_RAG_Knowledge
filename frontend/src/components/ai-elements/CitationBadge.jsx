// ==============================================================================
// AI ELEMENTS - CITATION BADGE COMPONENT
// Renders an interactive citation badge for grounding references.
// Clicking it directs focus to the Evidence Inspector split-pane.
// ==============================================================================

import React from 'react';
import { FileText } from 'lucide-react';

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

  // Confidence styling
  const getBadgeStyle = () => {
    if (score !== undefined && score >= 0.7) {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50";
    }
    return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50";
  };

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(citation)}
      className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border align-baseline cursor-pointer transition-all shadow-xs ${getBadgeStyle()}`}
      title={citation ? `${citation.file_name} • Score: ${score || 'N/A'}` : 'View Source In Inspector'}
    >
      <FileText className="w-3 h-3 flex-shrink-0" />
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-80 text-[10px]">
          ({score})
        </span>
      )}
    </button>
  );
}
