// ==============================================================================
// SIDEBAR COMPONENT (DARK ZINC WORKSPACE SYSTEM)
// Manages knowledge corpus navigation, document upload dropzone,
// vector store telemetry, and conversation session controls.
// ==============================================================================

import React, { useState, useRef } from 'react';
import {
  Brain,
  Plus,
  FileText,
  UploadCloud,
  Database,
  Cpu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  Table as TableIcon,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function Sidebar({
  documents = [],
  collectionStats = {},
  health = {},
  darkMode,
  setDarkMode,
  onNewChat,
  isCollapsed,
  setIsCollapsed,
  onDocumentUploaded,
  activeDocumentCount = 0
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

  /**
   * BLOCK 1: File Upload Handler
   * Handles drag-and-drop or file selection for PDF document ingestion.
   */
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadStatus({
        type: 'error',
        message: 'Only PDF documents are supported for Docling ingestion.'
      });
      setTimeout(() => setUploadStatus(null), 4000);
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadDocument(file);
      setUploadStatus({
        type: 'success',
        message: `Indexed "${file.name}" (${result.chunks_count || 'several'} chunks)`
      });
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to parse and index document.'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // If collapsed on desktop, render a compact vertical strip
  if (isCollapsed) {
    return (
      <aside className="w-16 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 justify-between transition-all duration-200 z-20 flex-shrink-0">
        <div className="flex flex-col items-center gap-4">
          {/* Brand Icon */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 hover:border-zinc-700 transition-colors"
            title="Expand Sidebar"
          >
            <Brain className="w-5 h-5 text-indigo-400" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Documents Pill */}
          <div
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title={`${documents.length} Indexed Documents`}
          >
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between transition-all duration-200 z-20 flex-shrink-0 select-none">
      
      {/* ==================================================================== */}
      {/* TOP SECTION: Header & Actions                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Brand Bar */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-sm">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-100 tracking-tight">Enterprise RAG</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Qdrant • Docling • NIM</p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Conversation */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>New Conversation</span>
            </div>
            <kbd className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* Scrollable Corpus & Documents Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          
          {/* Header with Document Count */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Knowledge Corpus
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
              </span>
            </div>

            {/* Document Ingestion Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`p-3 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                isUploading
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing with Docling...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-1">
                  <UploadCloud className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs text-zinc-300 font-medium">Upload PDF Specification</span>
                  <span className="text-[10px] text-zinc-400">Docling Hybrid Chunker & Tables</span>
                </div>
              )}
            </div>

            {/* Upload Notification Alert */}
            {uploadStatus && (
              <div
                className={`mt-2 p-2 rounded-lg text-[11px] flex items-start gap-1.5 border ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="leading-tight">{uploadStatus.message}</span>
              </div>
            )}
          </div>

          {/* Ingested Documents List */}
          <div className="space-y-1">
            {documents.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                No documents indexed yet. Upload a PDF above to begin.
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors group text-left"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono">
                          <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          <span>Indexed</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] font-mono text-zinc-400 flex-shrink-0">
                      Docling
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Infrastructure & Pipeline Telemetry */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1 block mb-2">
              System Telemetry
            </span>
            <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2 text-[11px]">
              
              {/* Qdrant Status */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Qdrant Vector DB
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {health.qdrant_connected ? 'Online' : 'Local Disk'}
                </span>
              </div>

              {/* Hybrid Index Mode */}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Hybrid Search</span>
                <span className="font-mono text-[10px] text-zinc-300">Dense + BM25</span>
              </div>

              {/* Reranker Model */}
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Cross-Encoder
                </span>
                <span className="font-mono text-[10px] text-zinc-300">Mistral-4B</span>
              </div>

              {/* Generation LLM */}
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  Generation LLM
                </span>
                <span className="font-mono text-[10px] text-zinc-300 truncate max-w-[100px]" title={health.llm_model || 'Nemotron-70B'}>
                  {health.llm_model ? health.llm_model.split('/')[1] : 'Nemotron-70B'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ==================================================================== */}
      {/* BOTTOM SECTION: User & Preferences Controls                         */}
      {/* ==================================================================== */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400">
        
        {/* Connection Pulse */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono text-zinc-400">FastAPI :8001</span>
        </div>

        {/* Theme Switch */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

      </div>

    </aside>
  );
}
