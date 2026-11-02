// ==============================================================================
// MAIN APP COMPONENT
// Orchestrates the Apple-style chat interface, real-time streaming,
// citation side-inspector, and document management drawer.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import CitationInspector from './components/CitationInspector';
import DocumentDrawer from './components/DocumentDrawer';
import { fetchHealth, fetchDocuments, streamChatQuery } from './services/api';
import { Brain, FileText, ArrowRight } from 'lucide-react';

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

    // 2. Append placeholder assistant message
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', citations: [] },
    ]);

    setIsStreaming(true);

    // 3. Initiate SSE streaming
    await streamChatQuery({
      query: queryText,
      topK: 5,
      onSources: (sources) => {
        // Pre-populate candidate citations if desired
      },
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
      
      {/* Floating Apple Navbar */}
      <Navbar
        health={health}
        onOpenDocuments={() => setIsDocumentDrawerOpen(true)}
        documentCount={documents.length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Chat Scroll Container */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col justify-start"
      >
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          
          {/* Welcome Screen / Empty State */}
          {messages.length === 0 && (
            <div className="text-center py-12 px-4 max-w-xl mx-auto my-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center text-white mx-auto mb-5 shadow-apple-md shadow-blue-500/20">
                <Brain className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-3">
                Enterprise Knowledge Base
              </h2>
              <p className="text-sm text-[#86868b] dark:text-[#a1a1a6] leading-relaxed mb-8">
                Ask questions grounded in technical PDFs, engineering manuals, and dense tabular data. Every answer includes verifiable page-level citations.
              </p>

              {/* Sample Prompt Pills */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {[
                  "What is the maximum pressure for valve V-200-B?",
                  "Show pressure tolerances from Table 4",
                  "Compare operating fluids across valve models"
                ].map((samplePrompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(samplePrompt)}
                    className="apple-button px-3.5 py-2.5 rounded-xl glass-card text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:border-[#0071e3]/40 text-left flex items-center justify-between gap-2"
                  >
                    <span>{samplePrompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0071e3] flex-shrink-0" />
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

      {/* Floating Bottom Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onStop={() => setIsStreaming(false)}
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
