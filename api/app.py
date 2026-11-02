# ==============================================================================
# FASTAPI BACKEND SERVER MODULE
# This file sets up our REST API and real-time streaming endpoints.
# It connects our frontend with:
# 1. PDF Upload & Ingestion (Docling + HybridChunker)
# 2. Hybrid Retrieval (Qdrant Dense + Sparse BM25 + NVIDIA Reranker)
# 3. Grounded Generation (NVIDIA LLM + Real-time Token Streaming + Citations)
# ==============================================================================

import os
import json
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

# Import our settings and system components
from config.settings import settings
from ingestion.pipeline import IngestionPipeline
from retrieval.vector_store import QdrantVectorStore
from retrieval.indexer import DocumentIndexer
from retrieval.hybrid_search import HybridRetriever
from generation.generator import GroundedGenerator


# ------------------------------------------------------------------------------
# BLOCK 1: Initialize FastAPI App and CORS Middleware
# We configure CORS so our React frontend (running on http://localhost:5173
# or any local dev port) can talk to this FastAPI server without browser blocks.
# ------------------------------------------------------------------------------
app = FastAPI(
    title="Enterprise RAG Knowledge Base API",
    description="RAG API powered by Docling, Qdrant Hybrid Search, and NVIDIA NIM Models",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # In development, allow requests from any frontend origin
    allow_credentials=True,
    allow_methods=["*"],           # Allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],           # Allow all headers
)

# Set up local directories to store uploaded PDFs and cached chunks
UPLOAD_DIR = Path("./storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Instantiate core services (sharing vector_store so embedded Qdrant doesn't duplicate)
pipeline = IngestionPipeline()
vector_store = QdrantVectorStore()
vector_store.create_hybrid_collection()
indexer = DocumentIndexer(store=vector_store)
retriever = HybridRetriever(store=vector_store)
generator = GroundedGenerator()


# ------------------------------------------------------------------------------
# BLOCK 2: Pydantic Request & Response Data Models
# Pydantic validates incoming JSON data automatically and returns helpful
# error messages if fields are formatted incorrectly.
# ------------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's question to ask the knowledge base")
    top_k: int = Field(default=5, description="Number of high-precision chunks to use for generation")
    filter_doc: Optional[str] = Field(default=None, description="Optional PDF filename to restrict search")


# ------------------------------------------------------------------------------
# BLOCK 3: Health Check Endpoint (GET /api/health)
# Tells the frontend whether the backend, Qdrant, and NVIDIA keys are ready.
# ------------------------------------------------------------------------------
@app.get("/api/health")
def get_health():
    """
    Checks the status of the server, Qdrant connection, and API credentials.
    """
    is_qdrant_alive = vector_store.check_connection()
    has_nvidia_key = settings.validate_keys()

    return {
        "status": "online",
        "qdrant_connected": is_qdrant_alive,
        "nvidia_key_configured": has_nvidia_key,
        "collection_name": settings.QDRANT_COLLECTION_NAME,
        "embedding_model": settings.NVIDIA_EMBEDDING_MODEL,
        "rerank_model": settings.NVIDIA_RERANK_MODEL,
        "llm_model": settings.NVIDIA_LLM_MODEL
    }


# ------------------------------------------------------------------------------
# BLOCK 4: Document Management Endpoint (GET /api/documents)
# Lists all uploaded PDFs, cached chunks, and collection point count.
# ------------------------------------------------------------------------------
@app.get("/api/documents")
def list_documents():
    """
    Returns the list of PDF files that have been uploaded to the system.
    """
    uploaded_files = []
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.glob("*.pdf"):
            uploaded_files.append({
                "filename": f.name,
                "size_bytes": f.stat().st_size,
                "uploaded_at": f.stat().st_mtime
            })

    # Get Qdrant collection statistics
    collection_stats = vector_store.get_collection_info()

    return {
        "documents": uploaded_files,
        "collection_stats": collection_stats
    }


# ------------------------------------------------------------------------------
# BLOCK 5: Document Upload & Indexing Endpoint (POST /api/documents/upload)
# Takes an uploaded PDF file, runs Docling extraction + HybridChunking,
# and indexes the resulting chunks into Qdrant.
# ------------------------------------------------------------------------------
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads a PDF, processes it with Docling, and indexes vectors into Qdrant.
    """
    # Verify that the file is actually a PDF
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only PDF files are supported."
        )

    # Save the uploaded file to disk in our storage/uploads folder
    saved_path = UPLOAD_DIR / file.filename
    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"[API] Saved uploaded file to: {saved_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Process the PDF through our Ingestion Pipeline (Docling + HybridChunker)
    try:
        chunks = pipeline.process_pdf(str(saved_path), use_cache=False)
    except Exception as e:
        print(f"[API] Error parsing PDF with Docling: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error parsing PDF with Docling: {str(e)}"
        )

    # Index the chunks into Qdrant (Dense + Sparse vectors)
    try:
        success = indexer.index_chunks(chunks)
        if not success:
            raise RuntimeError("Indexing failed in Qdrant.")
    except Exception as e:
        print(f"[API] Error indexing into Qdrant: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error indexing into Qdrant: {str(e)}"
        )

    return {
        "status": "success",
        "message": f"Successfully parsed and indexed '{file.filename}'!",
        "filename": file.filename,
        "chunks_indexed": len(chunks)
    }


# ------------------------------------------------------------------------------
# BLOCK 6: Standard Non-Streaming Query Endpoint (POST /api/query)
# Executes hybrid retrieval, cross-encoder rerank, and generates an answer.
# ------------------------------------------------------------------------------
@app.post("/api/query")
def query_knowledge_base(payload: QueryRequest):
    """
    Non-streaming question-answering endpoint.
    Returns the answer and verified citations in a single JSON response.
    """
    # Stage 1 & 2: Hybrid search + Cross-Encoder Rerank
    retrieved_chunks = retriever.search(
        query=payload.query,
        top_k=payload.top_k,
        filter_doc=payload.filter_doc
    )

    # Stage 3: Grounded Generation with explicit citations
    result = generator.generate_answer(
        query=payload.query,
        retrieved_chunks=retrieved_chunks
    )

    return {
        "query": payload.query,
        "answer": result["answer"],
        "citations": result["citations"],
        "retrieved_chunks": retrieved_chunks
    }


# ------------------------------------------------------------------------------
# BLOCK 7: Real-Time Streaming Chat Endpoint (POST /api/chat/stream)
# Uses Server-Sent Events (SSE) to stream tokens directly to the frontend.
# Event format:
#   data: {"type": "sources", "chunks": [...]}
#   data: {"type": "token", "content": "..."}
#   data: {"type": "done", "citations": [...]}
# ------------------------------------------------------------------------------
@app.post("/api/chat/stream")
def stream_chat(payload: QueryRequest):
    """
    Real-time streaming chat endpoint using Server-Sent Events (SSE).
    """
    def event_generator():
        # Step 1: Perform Hybrid Search and NVIDIA Cross-Encoder Rerank
        retrieved_chunks = retriever.search(
            query=payload.query,
            top_k=payload.top_k,
            filter_doc=payload.filter_doc
        )

        # Immediately send the retrieved sources to the frontend so the UI
        # can show the user what documents and pages were found!
        yield f"data: {json.dumps({'type': 'sources', 'chunks': retrieved_chunks})}\n\n"

        # Step 2: Stream LLM answer tokens one by one
        token_stream = generator.stream_answer(
            query=payload.query,
            retrieved_chunks=retrieved_chunks
        )

        for event in token_stream:
            # Yield each token or completion event formatted for SSE
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ------------------------------------------------------------------------------
# BLOCK 8: Standalone Server Runner
# You can start the server directly using:
# python api/app.py
# Or with uvicorn:
# uvicorn api.app:app --host 127.0.0.1 --port 8001 --reload
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("\n[Server] Starting FastAPI server on http://127.0.0.1:8001...")
    uvicorn.run("api.app:app", host="127.0.0.1", port=8001, reload=True)
