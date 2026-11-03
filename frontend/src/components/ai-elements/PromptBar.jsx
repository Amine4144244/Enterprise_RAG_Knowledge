// ==============================================================================
// ENTERPRISE AI STUDIO - PROMPT BAR (DOCKED COMMAND INPUT)
// Docked command-bar interface with auto-expanding textarea, model indicators,
// keyboard shortcuts, and stream abort controls.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, FolderOpen, Cpu, ShieldCheck } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 flex-shrink-0">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-sm p-3 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-all"
      >
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question grounded in your documents, tables, or specifications..."
          className="w-full bg-transparent border-0 resize-none outline-none text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 px-1 max-h-36 overflow-y-auto leading-relaxed"
        />

        {/* Action Bar */}
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          
          {/* Metadata Chips */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {/* Document Indicator */}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300">
              <FolderOpen className="w-3 h-3 text-indigo-500" />
              <span>{documentCount} {documentCount === 1 ? 'doc' : 'docs'} in store</span>
            </span>

            {/* Grounding Mode */}
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Grounded Mode</span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <span>Send</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">
                ↵
              </kbd>
            </span>

            {/* Submit / Abort Button */}
            <button
              type="submit"
              disabled={!input.trim() && !isStreaming}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isStreaming
                  ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-xs'
                  : input.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
              aria-label={isStreaming ? 'Stop streaming' : 'Send query'}
            >
              {isStreaming ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
