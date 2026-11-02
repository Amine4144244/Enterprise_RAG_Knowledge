// ==============================================================================
// FRONTEND API SERVICE MODULE
// Handles all network communications between our React UI and FastAPI backend.
// ==============================================================================

const API_BASE = '/api';

/**
 * BLOCK 1: Check System Health
 * Checks if FastAPI, Qdrant container, and NVIDIA models are online.
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[API] Health error:', err);
    return {
      status: 'offline',
      qdrant_connected: false,
      nvidia_key_configured: false
    };
  }
}

/**
 * BLOCK 2: Fetch Indexed Documents and Stats
 * Retrieves the list of uploaded PDFs and Qdrant collection statistics.
 */
export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[API] Fetch documents error:', err);
    return { documents: [], collection_stats: {} };
  }
}

/**
 * BLOCK 3: Upload and Index PDF File
 * Sends a PDF file using multipart/form-data to be parsed by Docling and indexed.
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return await res.json();
}

/**
 * BLOCK 4: Real-time Streaming Chat with SSE
 * Connects to /api/chat/stream and receives:
 * 1. 'sources': Array of candidate chunks retrieved & reranked
 * 2. 'token': Incremental LLM text tokens
 * 3. 'done': Final verified citation payload
 */
export async function streamChatQuery({
  query,
  topK = 5,
  onSources,
  onToken,
  onDone,
  onError,
}) {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, top_k: topK }),
    });

    if (!response.ok) {
      throw new Error(`Chat error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete lines in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'sources' && onSources) {
              onSources(event.chunks);
            } else if (event.type === 'token' && onToken) {
              onToken(event.content);
            } else if (event.type === 'done' && onDone) {
              onDone(event.citations || []);
            }
          } catch (e) {
            console.warn('[SSE] JSON parse warning:', e, jsonStr);
          }
        }
      }
    }
  } catch (err) {
    console.error('[API] Streaming failure:', err);
    if (onError) onError(err);
  }
}
