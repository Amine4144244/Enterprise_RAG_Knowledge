// ==============================================================================
// ENTERPRISE AI STUDIO - CHAT MESSAGE COMPONENT
// Renders user and assistant turns with ToolCall execution cards,
// Reasoning traces, interactive CitationBadges, and copy actions.
// ==============================================================================

import React, { useState } from 'react';
import { User, Brain, Copy, Check, FileText, CheckCircle2 } from 'lucide-react';
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

  // Copy assistant response
  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Render text with inline clickable CitationBadges
   * Replaces [SRC-1], [SRC-2] markers with interactive pills.
   */
  const renderGroundedContent = (text, citations = []) => {
    if (!text) return null;

    const citationMap = {};
    (citations || []).forEach((c) => {
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

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3`}>
      <div className={`flex gap-3 max-w-4xl w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-xs ${
          isUser 
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' 
            : 'bg-indigo-600 text-white shadow-xs'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
        </div>

        {/* Message Container */}
        <div className={`flex-1 min-w-0 ${isUser ? 'max-w-xl' : ''}`}>
          
          {/* If Assistant: Tool & Reasoning Traces */}
          {!isUser && (
            <>
              <ToolCall
                toolName="qdrant_hybrid_search"
                status={isStreaming && !message.content ? "running" : "completed"}
                resultCount={message.sources?.length || message.citations?.length || 0}
              />

              {message.sources && message.sources.length > 0 && (
                <Reasoning
                  sources={message.sources}
                  isThinking={isStreaming && !message.content}
                  onSelectSource={onSelectCitation}
                />
              )}
            </>
          )}

          {/* Message Text Body */}
          <div className={`rounded-lg px-4 py-3 text-xs sm:text-sm leading-relaxed border transition-colors ${
            isUser
              ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-medium'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs'
          }`}>
            
            <div className="whitespace-pre-wrap">
              {isUser ? (
                message.content
              ) : (
                renderGroundedContent(message.content, message.citations)
              )}

              {/* Streaming Cursor */}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-500 animate-pulse rounded-full align-middle" />
              )}
            </div>

            {/* Citations Footer Strip */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold text-[11px]">
                    Grounding Sources ({message.citations.length}):
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  title="Copy assistant response"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Badges List */}
                <div className="w-full flex flex-wrap gap-1.5 mt-1">
                  {message.citations.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectCitation(c)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono transition-colors"
                      title="Inspect citation"
                    >
                      <FileText className="w-3 h-3 text-indigo-500" />
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {c.source_id}
                      </span>
                      <span className="truncate max-w-[130px] font-sans">
                        {c.file_name}
                      </span>
                      <span className="text-zinc-400">
                        (p. {c.page_numbers?.join(',')})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
