// ==============================================================================
// CHAT INPUT COMPONENT (Apple Floating Action Pill)
// Features instant feedback on keydown and tactile send button.
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, StopCircle } from 'lucide-react';

export default function ChatInput({ onSendMessage, isStreaming, onStop }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
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
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-2 pl-4 flex items-end gap-2 shadow-apple-md border border-black/[0.08] dark:border-white/[0.1] transition-all focus-within:ring-2 focus-within:ring-[#0071e3]/30"
      >
        {/* Auto-growing Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a technical or numerical question from your documents..."
          className="flex-1 bg-transparent border-0 resize-none outline-none text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] py-2 max-h-28 overflow-y-auto leading-relaxed"
        />

        {/* Tactile Send Button */}
        <button
          type="submit"
          disabled={!input.trim() && !isStreaming}
          className={`apple-button w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isStreaming
              ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black cursor-pointer'
              : input.trim()
              ? 'bg-[#0071e3] text-white hover:bg-[#0077ed] cursor-pointer'
              : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#86868b] cursor-not-allowed'
          }`}
          aria-label={isStreaming ? 'Stop response' : 'Send message'}
        >
          {isStreaming ? (
            <StopCircle className="w-4 h-4" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
}
