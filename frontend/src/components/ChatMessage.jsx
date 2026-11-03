// ==============================================================================
// CHAT MESSAGE COMPONENT (AI ELEMENTS REDESIGN)
// Features role-aware styling, Reasoning collapsible accordion,
// interactive CitationBadges, and quick copy-to-clipboard actions.
// ==============================================================================

import React, { useState } from 'react';
import { User, Bot, Copy, Check, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
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
   * Replaces [SRC-1], [SRC-2] markers with clickable color-coded badges.
   */
  const renderGroundedContent = (text, citations = []) => {
    if (!text) return null;

    // Build lookup dictionary from source_id -> citation
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
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3.5`}>
      <div className={`flex gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* BLOCK 2: Avatar Icon (AI Elements standard Bot icon) */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser 
            ? 'bg-[#0071e3] text-white shadow-sm' 
            : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#0071e3] dark:text-[#42a5f5]'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* BLOCK 3: Message Body Container */}
        <div className="flex-1 min-w-0">
          
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

          {/* Message Text Bubble */}
          <div className={`rounded-2xl px-4 py-3 shadow-apple-sm transition-all text-sm leading-relaxed ${
            isUser
              ? 'bg-[#0071e3] text-white rounded-br-sm'
              : 'glass-card text-[#1d1d1f] dark:text-[#f5f5f7] rounded-bl-sm'
          }`}>
            
            {/* Text & Citations */}
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

            {/* BLOCK 4: Verified Citations Summary Bar */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-xs text-[#86868b] dark:text-[#a1a1a6] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium">Verified Sources ({message.citations.length}):</span>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="apple-button flex items-center gap-1 text-[11px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]"
                    title="Copy response"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Badges List */}
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
    </div>
  );
}
