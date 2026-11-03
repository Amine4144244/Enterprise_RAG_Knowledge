// ==============================================================================
// AI ELEMENTS - PROMPT BAR COMPONENT
// An AI-native input bar with auto-expanding textarea, document indicators,
// model badge, quick suggestion pills, and tactile submit/stop states.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, FolderOpen, Cpu, Sparkles, CornerDownLeft } from 'lucide-react';

export function PromptBar({
  onSendMessage,
  isStreaming,
  onStop,
  documentCount = 0,
  onOpenDocuments,
  modelName = "Llama-3.1-70B"
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      if (onStop) onStop();
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-2.5 shadow-apple-md border border-black/[0.08] dark:border-white/[0.1] transition-all focus-within:ring-2 focus-within:ring-[#0071e3]/30"
      >
        {/* BLOCK 1: Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question grounded in your documents, tables, or specifications..."
          className="w-full bg-transparent border-0 resize-none outline-none text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] px-2 py-1 max-h-36 overflow-y-auto leading-relaxed"
        />

        {/* BLOCK 2: Action Footer Bar */}
        <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
          
          {/* Left Metadata Chips */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#86868b]">
            {/* Documents Button */}
            <button
              type="button"
              onClick={onOpenDocuments}
              className="apple-button flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7]"
            >
              <FolderOpen className="w-3 h-3 text-[#0071e3]" />
              <span>{documentCount} {documentCount === 1 ? 'doc' : 'docs'}</span>
            </button>

            {/* Model Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.04]">
              <Cpu className="w-3 h-3 text-emerald-500" />
              <span className="truncate max-w-[130px] font-mono text-[10px]">
                {modelName}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[#86868b]">
              <span>Press</span>
              <kbd className="px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] font-mono">↵</kbd>
            </span>

            {/* Tactile Send / Stop Button */}
            <button
              type="submit"
              disabled={!input.trim() && !isStreaming}
              className={`apple-button w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isStreaming
                  ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-sm'
                  : input.trim()
                  ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer shadow-sm'
                  : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#86868b] cursor-not-allowed'
              }`}
              aria-label={isStreaming ? 'Stop streaming' : 'Send message'}
            >
              {isStreaming ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
