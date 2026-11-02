// ==============================================================================
// DOCUMENT MANAGEMENT DRAWER
// Allows users to drag-and-drop PDF files, triggers Docling extraction and
// Qdrant indexing, and displays indexed document metrics.
// ==============================================================================

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentDrawer({
  isOpen,
  onClose,
  documents = [],
  collectionStats = {},
  onRefresh
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle file selection from dropzone or input click
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error');
      setStatusMessage('Only PDF documents are supported.');
      return;
    }

    setUploadStatus('uploading');
    setStatusMessage(`Parsing '${file.name}' with Docling & indexing into Qdrant...`);

    try {
      const res = await uploadDocument(file);
      setUploadStatus('success');
      setStatusMessage(`Indexed ${res.chunks_indexed || 'all'} chunks successfully!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage(err.message || 'Error uploading file');
    }
  };

  // Drag and drop handlers
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* Scrim Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Apple Spring Sheet Panel */}
      <div className="relative w-full max-w-md h-full glass-material bg-white/95 dark:bg-[#1c1c1e]/95 shadow-apple-lg border-l border-black/[0.08] dark:border-white/[0.1] flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Document Knowledge Base
              </h2>
              <p className="text-xs text-[#86868b]">
                {collectionStats.points_count || 0} vectors in Qdrant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className="apple-button p-2 rounded-xl text-[#86868b] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="apple-button p-2 rounded-xl text-[#86868b] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* BLOCK 1: Apple Fluid Drag & Drop Zone */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
                isDragging
                  ? 'border-[#0071e3] bg-[#0071e3]/5 scale-[1.01]'
                  : 'border-black/[0.1] dark:border-white/[0.12] hover:border-[#0071e3]/50 bg-black/[0.01] dark:bg-white/[0.02]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3 text-[#0071e3]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Drop PDF here or click to browse
              </p>
              <p className="text-[11px] text-[#86868b] mt-1">
                Parsed with IBM Docling deep table & layout extraction
              </p>
            </div>

            {/* Upload Feedback Banner */}
            {uploadStatus && (
              <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                uploadStatus === 'uploading' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : uploadStatus === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}>
                {uploadStatus === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {uploadStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {uploadStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                <span className="flex-1 font-medium">{statusMessage}</span>
              </div>
            )}
          </div>

          {/* BLOCK 2: List of Indexed Documents */}
          <div>
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2.5">
              Indexed Documents ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="p-4 rounded-xl text-center text-xs text-[#86868b] bg-black/[0.02] dark:bg-white/[0.02]">
                No documents uploaded yet. Upload a PDF to start asking questions!
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[10px] text-[#86868b]">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      Ready
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
