// ==============================================================================
// MAIN APP COMPONENT (AI ELEMENTS REDESIGN)
// Orchestrates AI-native chat, multi-stage reasoning accordion,
// interactive citations, and document knowledge base drawer.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ChatMessage from './components/ChatMessage';
import { PromptBar } from './components/ai-elements/PromptBar';
import CitationInspector from './components/CitationInspector';
import DocumentDrawer from './components/DocumentDrawer';
import { fetchHealth, fetchDocuments, streamChatQuery } from './services/api';
import { Brain, ArrowRight, ShieldCheck, Database, Table } from 'lucide-react';

export default function App() {
  // ----------------------------------------------------------------------------
  // State Variables
  // ----------------------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isDocumentDrawerOpen, setIsDocumentDrawerOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [health, setHealth] = useState({ qdrant_connected: false, nvidia_key_configured: false });
  const [darkMode, setDarkMode] = useState(false);

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

  // Smooth autoscroll during streaming
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // ----------------------------------------------------------------------------
  // Send Message & Real-time Streaming Handler
  // ----------------------------------------------------------------------------
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isStreaming) return;

    // 1. Append user message
    const userMsg = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Append placeholder assistant message with sources and citations arrays
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', sources: [], citations: [] },
    ]);

    setIsStreaming(true);

    // 3. Initiate SSE streaming with AI Elements event hooks
    await streamChatQuery({
      query: queryText,
      topK: 5,
      // When backend emits 'sources' event (Qdrant RRF + Cross-Encoder rerank)
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
    <div className="flex flex-col h-screen w-full bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] overflow-hidden">
      
      {/* Floating Apple/AI Elements Navbar */}
      <Navbar
        health={health}
        onOpenDocuments={() => setIsDocumentDrawerOpen(true)}
        documentCount={documents.length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onClearChat={() => setMessages([])}
        messageCount={messages.length}
      />

      {/* Main Chat Scroll Container */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col justify-start"
      >
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          
          {/* Welcome Screen / Empty State */}
          {messages.length === 0 && (
            <div className="text-center py-10 px-4 max-w-xl mx-auto my-auto animate-in fade-in zoom-in-95 duration-500">
              
              {/* Brain Icon Hero */}
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center text-white mx-auto mb-4 shadow-apple-md shadow-blue-500/20">
                <Brain className="w-7 h-7" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                Enterprise Knowledge Base
              </h2>
              
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] leading-relaxed mb-6">
                Ask questions grounded in complex PDFs, multi-column tables, and engineering specifications with verified page citations.
              </p>

              {/* Architecture Highlights Pill Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs text-[#86868b]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <Table className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>Docling Table Layouts</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Qdrant Hybrid (Dense + BM25)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>NVIDIA Cross-Encoder Rerank</span>
                </span>
              </div>

              {/* Sample Prompt Pills */}
              <div className="space-y-2 text-left">
                {[
                  {
                    title: "Architecture Priorities",
                    prompt: "Which architecture domain has a priority of 'Critical (Immediate)', and what is its target state?"
                  },
                  {
                    title: "Risk & Mitigation Owners",
                    prompt: "What mitigation control is assigned to Database Engineering, and what is its severity level?"
                  },
                  {
                    title: "Strategic Execution Pillars",
                    prompt: "How does Pillar II plan to modernize core transactional monolithic services?"
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="apple-button w-full p-3 rounded-xl glass-card hover:border-[#0071e3]/40 flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0071e3] dark:text-[#42a5f5] block mb-0.5">
                        {item.title}
                      </span>
                      <span className="text-[#1d1d1f] dark:text-[#f5f5f7] truncate block">
                        {item.prompt}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#86868b] group-hover:text-[#0071e3] flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* Chat Messages List */}
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              onSelectCitation={(c) => setSelectedCitation(c)}
              isStreaming={isStreaming && index === messages.length - 1}
            />
          ))}

        </div>
      </main>

      {/* AI Elements PromptBar */}
      <PromptBar
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onStop={() => setIsStreaming(false)}
        documentCount={documents.length}
        onOpenDocuments={() => setIsDocumentDrawerOpen(true)}
        modelName={health.llm_model ? health.llm_model.split('/')[1] : "NVIDIA NIM"}
      />

      {/* Citation Inspector Side-Drawer */}
      <CitationInspector
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Document Management Drawer */}
      <DocumentDrawer
        isOpen={isDocumentDrawerOpen}
        onClose={() => setIsDocumentDrawerOpen(false)}
        documents={documents}
        collectionStats={collectionStats}
        onRefresh={loadInitialData}
      />

    </div>
  );
}
