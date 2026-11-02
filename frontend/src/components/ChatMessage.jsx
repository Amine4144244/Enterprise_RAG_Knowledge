// ==============================================================================
// CHAT MESSAGE COMPONENT
// Displays user messages and grounded assistant responses with clickable
// citation pills following Apple's fluid interactive principles.
// ==============================================================================

import React from 'react';
import { User, Brain, FileText, CheckCircle2 } from 'lucide-react';

export default function ChatMessage({
  message,
  onSelectCitation,
  isStreaming = false
}) {
  const isUser = message.role === 'user';

  /**
   * BLOCK 1: Render Text with Interactive Citation Pills
   * Replaces [SRC-1], [SRC-2] markers with clickable Apple-style pills.
   */
  const renderGroundedContent = (text, citations = []) => {
    if (!text) return null;

    // Build a quick lookup map from source_id ("SRC-1") to citation object
    const citationMap = {};
    citations.forEach(c => {
      citationMap[c.source_id] = c;
    });

    // Split text by regex pattern matching [SRC-X]
    const regex = /(\[SRC-\d+\])/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const match = part.match(/\[(SRC-\d+)\]/);
      if (match) {
        const sourceId = match[1];
        const citation = citationMap[sourceId];

        // Format pill label: e.g. "SRC-1 • manual.pdf, p. 14"
        const label = citation 
          ? `${sourceId} • p. ${citation.page_numbers ? citation.page_numbers.join(', ') : '?'}`
          : sourceId;

        return (
          <button
            key={index}
            onClick={() => citation && onSelectCitation(citation)}
            className="apple-button inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#0071e3]/10 dark:bg-[#0071e3]/25 text-[#0071e3] dark:text-[#42a5f5] hover:bg-[#0071e3]/20 dark:hover:bg-[#0071e3]/35 border border-[#0071e3]/20 dark:border-[#0071e3]/40 align-baseline shadow-sm cursor-pointer"
            title={citation ? `${citation.file_name} (${citation.section_headings?.join(' > ')})` : 'Source'}
          >
            <FileText className="w-3 h-3 text-[#0071e3] dark:text-[#42a5f5]" />
            <span>{label}</span>
          </button>
        );
      }

      // Regular text formatting (preserves linebreaks and simple markdown tables)
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3`}>
      <div className={`flex gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* BLOCK 2: Avatar Icon */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser 
            ? 'bg-[#0071e3] text-white shadow-sm' 
            : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#0071e3] dark:text-[#42a5f5]'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
        </div>

        {/* BLOCK 3: Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-apple-sm transition-all text-sm leading-relaxed ${
          isUser
            ? 'bg-[#0071e3] text-white rounded-br-sm'
            : 'glass-card text-[#1d1d1f] dark:text-[#f5f5f7] rounded-bl-sm'
        }`}>
          
          {/* Main Text Content */}
          <div className="whitespace-pre-wrap font-normal">
            {isUser ? (
              message.content
            ) : (
              renderGroundedContent(message.content, message.citations)
            )}
            
            {/* Real-time Streaming Cursor */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-[#0071e3] animate-pulse rounded-full align-middle" />
            )}
          </div>

          {/* BLOCK 4: Citations Footer (Click to inspect source) */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-xs text-[#86868b] dark:text-[#a1a1a6] mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">Verified Sources ({message.citations.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectCitation(c)}
                    className="apple-button flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.04] dark:border-white/[0.06]"
                  >
                    <FileText className="w-3 h-3 text-[#0071e3]" />
                    <span className="font-semibold">{c.source_id}:</span>
                    <span className="truncate max-w-[140px]">{c.file_name}</span>
                    <span className="text-[#86868b] text-[11px]">(p. {c.page_numbers?.join(',')})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
