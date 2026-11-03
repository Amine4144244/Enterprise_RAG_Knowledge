// ==============================================================================
// CHAT MESSAGE COMPONENT (DARK ZINC WORKSPACE SYSTEM)
// Features role-aware styling, ToolCall badge, Reasoning disclosure accordion,
// inline CitationBadges, and bottom verified source chips.
// ==============================================================================

import React, { useState } from 'react';
import {
  User,
  Brain,
  Copy,
  Check,
  FileText,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import { Reasoning } from './ai-elements/Reasoning';
import { ToolCall } from './ai-elements/ToolCall';
import { CitationBadge } from './ai-elements/CitationBadge';

export default function ChatMessage({
  message,
  onSelectCitation,
  isStreaming = false
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  // Copy assistant response to clipboard
  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * BLOCK 1: Render Text with Interactive AI Elements CitationBadges
   * Converts [SRC-1], [SRC-2] markers into clickable CitationBadge components.
   */
  const renderGroundedContent = (text, citations = []) => {
    if (!text) return null;

    // Lookup dictionary from source_id -> citation
    const citationMap = {};
    (citations || []).forEach(c => {
      citationMap[c.source_id] = c;
    });

    const regex = /(\[SRC-\d+\])/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const match = part.match(/\[(SRC-\d+)\]/);
      if (match) {
        const sourceId = match[1];
        const citation = citationMap[sourceId];

        return (
          <CitationBadge
            key={index}
            sourceId={sourceId}
            citation={citation}
            onClick={onSelectCitation}
          />
        );
      }

      // Plain text part
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`w-full py-4 border-b border-zinc-800/40 ${isUser ? 'bg-zinc-900/20' : 'bg-transparent'}`}>
      <div className="max-w-4xl mx-auto px-4 flex gap-3.5">
        
        {/* ================================================================== */}
        {/* AVATAR BADGE                                                       */}
        {/* ================================================================== */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MESSAGE BODY                                                       */}
        {/* ================================================================== */}
        <div className="flex-1 min-w-0">
          
          {/* Header Row: Role & Actions */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                {isUser ? 'You' : 'Enterprise RAG Assistant'}
              </span>
              {!isUser && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
                  NVIDIA NIM Grounded
                </span>
              )}
            </div>

            {/* Copy Button for Assistant */}
            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* If Assistant: Show AI Elements Tool & Reasoning Accordion */}
          {!isUser && (
            <>
              {/* Tool Execution Badge */}
              <ToolCall
                toolName="hybrid_search"
                status={isStreaming && !message.content ? "running" : "completed"}
                resultCount={message.sources?.length || message.citations?.length || 0}
              />

              {/* Collapsible Retrieval & Reasoning Trace */}
              {message.sources && message.sources.length > 0 && (
                <Reasoning
                  sources={message.sources}
                  isThinking={isStreaming && !message.content}
                  onSelectSource={onSelectCitation}
                />
              )}
            </>
          )}

          {/* Main Message Content */}
          <div className="text-sm text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap selection:bg-indigo-500/30">
            {isUser ? (
              message.content
            ) : (
              renderGroundedContent(message.content, message.citations)
            )}

            {/* Real-time Streaming Cursor */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
            )}
          </div>

          {/* Verified Citations Summary Footer */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-zinc-300">
                  Verified Grounding Sources ({message.citations.length}):
                </span>
              </div>

              {/* Badges List */}
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectCitation(c)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 transition-colors"
                  >
                    {c.is_table ? (
                      <TableIcon className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <FileText className="w-3 h-3 text-indigo-400" />
                    )}
                    <span className="font-mono font-semibold text-indigo-300">{c.source_id}:</span>
                    <span className="truncate max-w-[160px]">{c.file_name}</span>
                    <span className="text-zinc-400 font-mono text-[10px]">
                      p.{c.page_numbers?.join(',') || '1'}
                    </span>
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
