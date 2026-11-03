// ==============================================================================
// ENTERPRISE AI STUDIO - SIDEBAR (LEFT RAIL)
// Provides document repository management, drag-and-drop PDF ingestion,
// Qdrant vector database telemetry, and pipeline health monitoring.
// ==============================================================================

import React, { useRef, useState } from 'react';
import { 
  Brain, 
  Plus, 
  UploadCloud, 
  FileText, 
  Database, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon, 
  Trash2, 
  RefreshCw,
  Server,
  ShieldCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({
  documents = [],
  collectionStats = {},
  health = {},
  onUploadFile,
  uploadStatus,
  uploadMessage,
  onRefreshDocs,
  darkMode,
  setDarkMode,
  onClearChat,
  onSelectDocFilter,
  selectedDocFilter,
  isOpen = true,
  onClose
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(true);

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 flex-shrink-0 flex flex-col bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* 1. Header & Brand */}
      <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                Enterprise KB
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Grounded Retrieval Studio
            </p>
          </div>
        </div>

        {/* Health Beacon */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              health.qdrant_connected && health.nvidia_key_configured
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                : 'bg-amber-500 animate-pulse'
            }`}
            title={
              health.qdrant_connected && health.nvidia_key_configured
                ? 'All services operational'
                : 'Service degraded'
            }
          />
        </div>
      </div>

      {/* 2. New Query Button */}
      <div className="p-3">
        <button
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-100 dark:text-zinc-900 text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Grounding Query</span>
        </button>
      </div>

      {/* 3. Main Scrollable Navigation Rail */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        
        {/* SECTION: Knowledge Base Documents */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Documents ({documents.length})
            </span>
            <button
              onClick={onRefreshDocs}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
              title="Refresh indexed documents"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Compact PDF Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onUploadFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs">
              <UploadCloud className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Drop PDF or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span></span>
            </div>

            {uploadStatus === 'uploading' && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Ingesting with Docling...</span>
              </div>
            )}
            {uploadStatus === 'success' && (
              <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{uploadMessage || 'Document indexed!'}</span>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="mt-2 text-[11px] text-rose-500 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{uploadMessage}</span>
              </div>
            )}
          </div>

          {/* Document Item List */}
          <div className="mt-2 space-y-1">
            {documents.length === 0 ? (
              <div className="text-center py-4 text-xs text-zinc-400">
                No documents indexed yet
              </div>
            ) : (
              documents.map((doc, idx) => {
                const isSelected = selectedDocFilter === doc.file_name;
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectDocFilter && onSelectDocFilter(isSelected ? null : doc.file_name)}
                    className={`group px-2.5 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`} />
                      <span className="truncate font-medium">
                        {doc.file_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 text-[10px] text-zinc-400 font-mono">
                      <span>{doc.chunk_count} chunks</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION: System Telemetry & Architecture */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            className="w-full flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2"
          >
            <span>Pipeline Architecture</span>
            {telemetryOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {telemetryOpen && (
            <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-2.5 space-y-2 text-[11px]">
              
              {/* Qdrant Status */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Database className="w-3 h-3 text-indigo-500" />
                  <span>Qdrant Store</span>
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-medium">
                  {collectionStats.points_count ?? 0} vectors
                </span>
              </div>

              {/* Retrieval Modes */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Layers className="w-3 h-3 text-emerald-500" />
                  <span>Hybrid Index</span>
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  Dense + BM25 (RRF)
                </span>
              </div>

              {/* Cross-Encoder Reranker */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  <span>Reranker</span>
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  NVIDIA NeMo NIM
                </span>
              </div>

              {/* Generation Model */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Cpu className="w-3 h-3 text-purple-500" />
                  <span>LLM</span>
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={health.llm_model || 'NVIDIA NIM'}>
                  {health.llm_model ? health.llm_model.split('/')[1] || health.llm_model : 'Llama-3.1-70B'}
                </span>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 4. Footer & Actions */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100/50 dark:bg-zinc-900/50">
        
        {/* Dark / Light Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Toggle appearance"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Clear Chat */}
        <button
          onClick={onClearChat}
          className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Clear active conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

      </div>
    </aside>
  );
}
