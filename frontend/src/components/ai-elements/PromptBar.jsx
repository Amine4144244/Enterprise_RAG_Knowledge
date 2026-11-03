// ==============================================================================
// AI ELEMENTS - PROMPT BAR COMPONENT (DARK / LIGHT ZINC WORKSPACE)
// Auto-resizing textarea with keyboard shortcuts, active document indicators,
// and tactile submit / stop streaming states.
// Fully supports dual light and dark modes with high legibility.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  FileText,
  Cpu
} from 'lucide-react';

export default function PromptBar({
  onSendMessage,
  isStreaming,
  onStop,
  documentCount = 0,
  modelName = "Nemotron-70B"
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-600/30"
      >
        {/* ==================================================================== */}
        {/* INPUT TEXTAREA                                                       */}
        {/* ==================================================================== */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything grounded in your enterprise PDFs, tables, or architecture specs..."
          className="w-full bg-transparent border-0 resize-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-1 py-1 max-h-40 overflow-y-auto leading-relaxed"
        />

        {/* ==================================================================== */}
        {/* ACTION & METADATA BAR                                                */}
        {/* ==================================================================== */}
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          
          {/* Active Context Chips */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {/* Active Document Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 shadow-sm">
              <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>{documentCount} {documentCount === 1 ? 'doc indexed' : 'docs indexed'}</span>
            </div>

            {/* LLM Model Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] border border-zinc-100 dark:border-transparent">
              <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-[120px]">{modelName}</span>
            </div>
          </div>

          {/* Right Controls & Send Button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                ↵
              </kbd>
            </span>

            {/* Submit / Stop Button */}
            <button
              type="submit"
              disabled={!input.trim() && !isStreaming}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                isStreaming
                  ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-md shadow-rose-500/20'
                  : input.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
              }`}
              title={isStreaming ? "Stop generation" : "Send query (Enter)"}
            >
              {isStreaming ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}

// Named export for compatibility
export { PromptBar };
