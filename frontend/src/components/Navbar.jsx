// ==============================================================================
// ENTERPRISE AI STUDIO - NAVBAR (CENTER STAGE HEADER)
// Crisp workspace header with breadcrumbs, pipeline telemetry badges,
// and evidence inspector split-screen toggles.
// ==============================================================================

import React from 'react';
import { 
  Menu, 
  PanelRight, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Database,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  onToggleSidebar,
  onToggleEvidencePane,
  isEvidencePaneOpen,
  health = {}
}) {
  const modelName = health.llm_model 
    ? health.llm_model.split('/')[1] || health.llm_model 
    : 'Llama-3.1-70B';

  return (
    <header className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between flex-shrink-0 z-10">
      
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            Workspace
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Grounded Intelligence Session
          </span>
        </div>
      </div>

      {/* Right: Telemetry Badges & Evidence Toggle */}
      <div className="flex items-center gap-2">
        
        {/* Model Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
          <Cpu className="w-3 h-3 text-purple-500" />
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            {modelName}
          </span>
        </div>

        {/* Reranker Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            NeMo Reranker
          </span>
        </div>

        {/* Toggle Evidence Inspector Button */}
        <button
          onClick={onToggleEvidencePane}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            isEvidencePaneOpen
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
          title="Toggle Evidence Inspector split-pane"
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Evidence Inspector</span>
        </button>

      </div>

    </header>
  );
}
