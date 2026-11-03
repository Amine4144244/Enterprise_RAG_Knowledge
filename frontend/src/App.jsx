// ==============================================================================
// ENTERPRISE AI STUDIO - APP ROOT COMPONENT
// Orchestrates 3-column split-screen studio workspace:
// 1. Left Rail: Document Repository, Ingestion Dropzone & Pipeline Telemetry.
// 2. Center Stage: Grounded Chat Conversation, Tool Calls, Reasoning, & Command Bar.
// 3. Right Pane: Non-Modal Evidence & Docling Table Grounding Inspector.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ChatMessage from './components/ChatMessage';
import { PromptBar } from './components/ai-elements/PromptBar';
import CitationPane from './components/CitationPane';
import { fetchHealth, fetchDocuments, streamChatQuery, uploadDocument } from './services/api';
import { Brain, ArrowRight, Table, Database, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export default function App() {
  // ----------------------------------------------------------------------------
  // State Management
  // ----------------------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isEvidencePaneOpen, setIsEvidencePaneOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Documents & Health State
  const [documents, setDocuments] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [health, setHealth] = useState({ qdrant_connected: false, nvidia_key_configured: false });
  const [darkMode, setDarkMode] = useState(true); // Default to sleek dark developer mode

  // Upload State
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedDocFilter, setSelectedDocFilter] = useState(null);

  const chatContainerRef = useRef(null);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial data load: check backend health and fetch indexed documents
  const loadInitialData = async () => {
    try {
      const healthData = await fetchHealth();
      setHealth(healthData);

      const docData = await fetchDocuments();
      setDocuments(docData.documents || []);
      setCollectionStats(docData.collection_stats || {});
    } catch (err) {
      console.warn("Could not reach backend health endpoint:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Smooth autoscroll during streaming
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Handle PDF file upload from sidebar dropzone
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error');
      setUploadMessage('Only PDF documents are supported.');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage(`Parsing '${file.name}' with Docling...`);

    try {
      const res = await uploadDocument(file);
      setUploadStatus('success');
      setUploadMessage(`Indexed ${res.chunks_indexed || 'all'} chunks into Qdrant!`);
      await loadInitialData();
      setTimeout(() => setUploadStatus('idle'), 4000);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Error processing document');
      setTimeout(() => setUploadStatus('idle'), 5000);
    }
  };

  // ----------------------------------------------------------------------------
  // Query Streaming Pipeline
  // ----------------------------------------------------------------------------
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isStreaming) return;

    // 1. Append user message
    const userMsg = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Append assistant placeholder message
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', sources: [], citations: [] },
    ]);

    setIsStreaming(true);

    // 3. Initiate SSE streaming with AI Elements hooks
    await streamChatQuery({
      query: queryText,
      topK: 5,
      // When backend emits hybrid search & reranked sources
      onSources: (sources) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.sources = sources;
          }
          return updated;
        });

        // Automatically load the highest-ranked source in the Evidence Inspector
        if (sources && sources.length > 0) {
          setSelectedCitation(sources[0]);
          setIsEvidencePaneOpen(true);
        }
      },
      // Stream content tokens
      onToken: (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += token;
          }
          return updated;
        });
      },
      // When generation finishes
      onDone: (verifiedCitations) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.citations = verifiedCitations;
          }
          return updated;
        });
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += `\n\n*(Error connecting to generation service: ${err.message})*`;
          }
          return updated;
        });
        setIsStreaming(false);
      },
    });
  };

  // When a citation pill is clicked in chat, focus and open Evidence Inspector
  const handleSelectCitation = (citation) => {
    setSelectedCitation(citation);
    setIsEvidencePaneOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. LEFT RAIL: Sidebar (Document Repository & Pipeline Telemetry) */}
      <Sidebar
        documents={documents}
        collectionStats={collectionStats}
        health={health}
        onUploadFile={handleFileUpload}
        uploadStatus={uploadStatus}
        uploadMessage={uploadMessage}
        onRefreshDocs={loadInitialData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onClearChat={() => setMessages([])}
        selectedDocFilter={selectedDocFilter}
        onSelectDocFilter={setSelectedDocFilter}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. CENTER STAGE: Conversation & Command Input */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
        
        {/* Workspace Navbar Header */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleEvidencePane={() => setIsEvidencePaneOpen(!isEvidencePaneOpen)}
          isEvidencePaneOpen={isEvidencePaneOpen}
          health={health}
        />

        {/* Conversation Stream Scroll Container */}
        <main
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col justify-start"
        >
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center">
            
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-8 px-4 max-w-2xl mx-auto my-auto text-center">
                
                {/* Brand Badge */}
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-sm shadow-indigo-500/20">
                  <Brain className="w-6 h-6" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                  Enterprise Knowledge Intelligence
                </h2>

                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
                  Precision question-answering with IBM Docling table extraction, Qdrant hybrid search, and NVIDIA NeMo Cross-Encoder reranking.
                </p>

                {/* Architecture Highlights */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <Table className="w-3.5 h-3.5 text-blue-500" />
                    <span>Docling Table Layouts</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Qdrant Hybrid (Dense + BM25)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>NeMo Cross-Encoder Rerank</span>
                  </span>
                </div>

                {/* Sample Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                  {[
                    {
                      title: "Architecture Priorities",
                      desc: "Immediate critical target states",
                      prompt: "Which architecture domain has a priority of 'Critical (Immediate)', and what is its target state?"
                    },
                    {
                      title: "Risk & Mitigation",
                      desc: "Database engineering controls",
                      prompt: "What mitigation control is assigned to Database Engineering, and what is its severity level?"
                    },
                    {
                      title: "Monolith Migration",
                      desc: "Pillar II execution plan",
                      prompt: "How does Pillar II plan to modernize core transactional monolithic services?"
                    }
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left group shadow-xs"
                    >
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 block mb-1">
                        {card.title}
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                onSelectCitation={handleSelectCitation}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}

          </div>
        </main>

        {/* Docked Command Bar Input */}
        <PromptBar
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStop={() => setIsStreaming(false)}
          documentCount={documents.length}
          modelName={health.llm_model ? health.llm_model.split('/')[1] : "NVIDIA NIM"}
        />

      </div>

      {/* 3. RIGHT PANE: Evidence Inspector (Non-Modal Split-Screen) */}
      <CitationPane
        citation={selectedCitation}
        isOpen={isEvidencePaneOpen}
        onClose={() => setIsEvidencePaneOpen(false)}
      />

    </div>
  );
}
