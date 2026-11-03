// ==============================================================================
// AI ELEMENTS - CITATION BADGE COMPONENT (DARK ZINC WORKSPACE)
// Inline superscript/pill badge representing a verified source citation.
// Clicking toggles the Citation Inspector with full provenance.
// ==============================================================================

import React from 'react';
import { FileText, Table as TableIcon } from 'lucide-react';

export function CitationBadge({
  sourceId,
  citation,
  onClick
}) {
  const score = citation?.rerank_score !== undefined ? citation.rerank_score : citation?.score;
  const isTable = citation?.is_table;
  const pageStr = citation?.page_numbers && citation.page_numbers.length > 0 
    ? citation.page_numbers.join(',') 
    : '1';

  // Confidence style based on cross-encoder rerank score
  const getBadgeStyle = () => {
    if (score !== undefined && score !== null) {
      const num = Number(score);
      if (num >= 0.7) {
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20";
      }
      if (num >= 0.4) {
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20";
      }
    }
    return "bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700/80";
  };

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(citation || { source_id: sourceId })}
      className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono border align-baseline cursor-pointer transition-colors shadow-sm select-none ${getBadgeStyle()}`}
      title={citation ? `${citation.file_name} • p. ${pageStr} (Score: ${score || 'N/A'})` : `Source ${sourceId}`}
    >
      {isTable ? (
        <TableIcon className="w-2.5 h-2.5 flex-shrink-0" />
      ) : (
        <FileText className="w-2.5 h-2.5 flex-shrink-0" />
      )}
      <span className="font-semibold">{sourceId}</span>
      <span className="opacity-75">p.{pageStr}</span>
    </button>
  );
}
