// ==============================================================================
// MAIN APPLICATION COMPONENT (DARK ZINC ENTERPRISE WORKSPACE)
// 3-Pane Architecture: [Corpus & Telemetry Sidebar] | [Conversation Canvas] | [Citation Inspector]
// Implements AI Elements streaming, Docling table preview, and NVIDIA NIM grounding.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { PromptBar } from './components/ai-elements/PromptBar';
import CitationInspector from './components/CitationInspector';
import { fetchHealth, fetchDocuments, streamChatQuery } from './services/api';
import {
  Brain,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  Table as TableIcon,
  Layers,
  Sparkles,
  PanelRight,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // ----------------------------------------------------------------------------
  // State Variables
  // ----------------------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [health, setHealth] = useState({ qdrant_connected: false, nvidia_key_configured: false });
  const [darkMode, setDarkMode] = useState(true); // Default to dark zinc workspace
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const chatContainerRef = useRef(null);

  // Sync dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial data load: check health and fetch documents
  const loadInitialData = async () => {
    const healthData = await fetchHealth();
    setHealth(healthData);

    const docData = await fetchDocuments();
    setDocuments(docData.documents || []);
    setCollectionStats(docData.collection_stats || {});
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Keyboard shortcut listeners (Esc to close inspector, Cmd+N for new chat)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCitation(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setMessages([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth autoscroll during streaming
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // ----------------------------------------------------------------------------
  // Real-time Streaming Query Handler
  // ----------------------------------------------------------------------------
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isStreaming) return;

    // 1. Append user message
    const userMsg = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Append placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', sources: [], citations: [] },
    ]);

    setIsStreaming(true);

    // 3. Initiate SSE streaming with AI Elements event hooks
    await streamChatQuery({
      query: queryText,
      topK: 5,
      // When backend emits candidate sources (Docling + Qdrant RRF + Cross-Encoder)
      onSources: (sources) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.sources = sources;
          }
          return updated;
        });
      },
      // When backend streams tokens
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
      // When generation finishes and citations are verified
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

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* ==================================================================== */}
      {/* PANE 1: Knowledge Corpus & Telemetry Sidebar                         */}
      {/* ==================================================================== */}
      <Sidebar
        documents={documents}
        collectionStats={collectionStats}
        health={health}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNewChat={() => setMessages([])}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onDocumentUploaded={loadInitialData}
      />

      {/* ==================================================================== */}
      {/* PANE 2: Center Conversation & Telemetry Canvas                       */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-zinc-950 relative">
        
        {/* Top Workspace Header Bar */}
        <header className="h-12 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/70 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-300">Workspace</span>
            <span className="text-zinc-400 text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400">
              {documents.length > 0 ? `${documents[0].file_name}` : 'Enterprise Corpus'}
            </span>
            {documents.length > 1 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                +{documents.length - 1} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Document State */}
            <button
              onClick={loadInitialData}
              className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh Knowledge Base"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Citation Inspector Toggle Indicator */}
            {selectedCitation && (
              <button
                onClick={() => setSelectedCitation(null)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono hover:bg-indigo-500/20"
                title="Close Inspector"
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span>Inspector Active</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto flex flex-col justify-start"
        >
          {/* Welcome Screen / Empty State */}
          {messages.length === 0 && (
            <div className="max-w-2xl w-full mx-auto my-auto px-4 py-8 text-center animate-in fade-in duration-300">
              
              {/* Brain Icon Badge */}
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-lg shadow-black">
                <Brain className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
                Enterprise Knowledge Workspace
              </h2>
              
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 max-w-lg mx-auto">
                Grounded multi-stage retrieval over engineering specifications, architecture blueprints, and complex tables with verified page citations.
              </p>

              {/* Architecture Pipeline Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <TableIcon className="w-3 h-3 text-indigo-400" />
                  <span>IBM Docling Tables</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Qdrant Hybrid RRF</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  <span>NVIDIA Mistral Reranker</span>
                </span>
              </div>

              {/* Sample Queries */}
              <div className="text-left space-y-2 max-w-xl mx-auto">
                <span className="text-[11px] uppercase font-semibold text-zinc-400 font-mono block px-1">
                  Example Inquiries
                </span>
                {[
                  {
                    title: "Architecture Priorities & Domain States",
                    prompt: "Which architecture domain has a priority of 'Critical (Immediate)', and what is its target state?"
                  },
                  {
                    title: "Risk Matrix & Mitigation Controls",
                    prompt: "What mitigation control is assigned to Database Engineering, and what is its severity level?"
                  },
                  {
                    title: "Core Service Modernization",
                    prompt: "How does Pillar II plan to modernize core transactional monolithic services?"
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="w-full p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-indigo-400 block mb-0.5">
                        {item.title}
                      </span>
                      <span className="text-xs text-zinc-300 truncate block">
                        {item.prompt}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              onSelectCitation={(c) => setSelectedCitation(c)}
              isStreaming={isStreaming && index === messages.length - 1}
            />
          ))}
        </main>

        {/* Docked AI Elements PromptBar */}
        <PromptBar
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStop={() => setIsStreaming(false)}
          documentCount={documents.length}
          modelName={health.llm_model ? health.llm_model.split('/')[1] : "Nemotron-70B"}
        />

      </div>

      {/* ==================================================================== */}
      {/* PANE 3: Grounding Provenance & Citation Inspector                    */}
      {/* ==================================================================== */}
      <CitationInspector
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

    </div>
  );
}
