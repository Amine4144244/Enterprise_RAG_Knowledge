// ==============================================================================
// NAVBAR COMPONENT (AI Elements & Apple Design)
// Floating translucent header with system health, document drawer button,
// and quick new-chat action.
// ==============================================================================

import React from 'react';
import { Database, Cpu, FolderOpen, Sun, Moon, Brain, PlusCircle } from 'lucide-react';

export default function Navbar({
  health,
  onOpenDocuments,
  documentCount = 0,
  darkMode,
  setDarkMode,
  onClearChat,
  messageCount = 0
}) {
  return (
    <header className="sticky top-0 z-30 w-full px-4 sm:px-6 pt-3 pb-2">
      <div className="max-w-6xl mx-auto glass-material rounded-2xl px-4 py-2.5 shadow-apple-sm flex items-center justify-between transition-all">
        
        {/* BLOCK 1: Brand & Logo with Brain Icon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              Enterprise Knowledge Base
            </h1>
            <p className="text-[11px] text-[#86868b] hidden sm:block">
              Docling • Qdrant Hybrid • NVIDIA NIM
            </p>
          </div>
        </div>

        {/* BLOCK 2: Status Badges (Qdrant & NVIDIA) */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          {/* Qdrant Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#a1a1a6]">
            <Database className="w-3.5 h-3.5" />
            <span>Qdrant:</span>
            <span className={`inline-block w-2 h-2 rounded-full ${
              health.qdrant_connected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-amber-400'
            }`} />
            <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              {health.qdrant_connected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* NVIDIA Models Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#a1a1a6]">
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              {health.llm_model ? health.llm_model.split('/')[1] : 'NVIDIA NIM'}
            </span>
          </div>
        </div>

        {/* BLOCK 3: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* New Chat Button (visible when conversation is active) */}
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              className="apple-button flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
              title="Start a new conversation"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#0071e3]" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}

          {/* Documents Drawer Trigger Button */}
          <button
            onClick={onOpenDocuments}
            className="apple-button flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.04] dark:border-white/[0.06]"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Documents</span>
            {documentCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#0071e3] text-white text-[10px] font-semibold">
                {documentCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="apple-button p-2 rounded-xl text-[#6e6e73] dark:text-[#a1a1a6] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
