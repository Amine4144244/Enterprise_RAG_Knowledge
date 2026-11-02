# Enterprise RAG Knowledge Base

An enterprise-grade Retrieval-Augmented Generation (RAG) platform specialized in technical documentation, engineering manuals, and dense tabular data.

Built with **IBM Docling**, **Qdrant Hybrid Search (Dense + Sparse BM25)**, **NVIDIA NIM Models**, and a fluid, **Apple-inspired React UI**.

---

## 🌟 Key Features

1. **Layout & Table Extraction (IBM Docling):**
   - Deep structural recognition for complex multi-column PDFs and financial/engineering tables.
   - Table borders and column-row relational geometry are preserved into Markdown tables.

2. **Hierarchical Hybrid Chunking (`HybridChunker`):**
   - Tokenizer-aware chunking (512 tokens max) respecting document hierarchy.
   - Prepends heading breadcrumb paths (`Document > Section > Subheading`) to prevent orphan chunks.
   - Preserves exact page numbers (`prov.page_no`) and bounding boxes for deterministic citation provenance.

3. **Two-Stage Hybrid Search & Reranking:**
   - **Stage 1 (High Recall):** Native Qdrant hybrid search blending NVIDIA Dense Embeddings (`nvidia/nv-embedqa-e5-v5`, 1024-dim) with FastEmbed BM25 Sparse Vectors (`Qdrant/bm25`) using server-side **Reciprocal Rank Fusion (RRF)**.
   - **Stage 2 (High Precision):** NVIDIA NIM Cross-Encoder Reranker (`nvidia/nv-rerankqa-mistral-4b-v3`) that re-scores candidate chunks through joint cross-attention to isolate exact alphanumeric serial codes, error IDs, and numerical tolerances.

4. **Grounded Generation & Citation Verification:**
   - Structured XML prompt injection (`<source id="SRC-1" file="..." pages="..." section="...">`).
   - NVIDIA NIM LLM (`meta/llama-3.1-70b-instruct`).
   - Hallucination guard validates all generated `[SRC-X]` markers against actual retrieved chunks before rendering.

5. **Apple-Designed Frontend (Vite + React + Tailwind):**
   - Built following Apple's fluid interface foundations (WWDC *Designing Fluid Interfaces*):
     - Translucent materials (`backdrop-filter: blur(24px) saturate(190%)` with subtle top-edge lighting).
     - SF Pro typography with optical tracking (`-0.02em` for headings).
     - Instant tactile press feedback (`active:scale-[0.97]`).
   - **Interactive Citation Inspector:** Clicking `[SRC-1 • manual.pdf, p. 14]` slides in a side-sheet drawer displaying the verbatim chunk, confidence score, section breadcrumbs, and formatted tables.
   - **Knowledge Base Drawer:** Fluid drag-and-drop PDF upload zone with real-time indexing status and document metrics.
   - **Real-Time Token Streaming:** Server-Sent Events (SSE) with auto-scroll that respects user gestures.

---

## 🚀 Quick Start Guide

### 1. Start Qdrant in Docker
```powershell
docker compose up -d
```
Verify Qdrant is running at [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your NVIDIA API key (from [build.nvidia.com](https://build.nvidia.com)):
```ini
NVIDIA_API_KEY=nvapi-...
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=enterprise_knowledge_base
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
NVIDIA_RERANK_MODEL=nvidia/nv-rerankqa-mistral-4b-v3
NVIDIA_LLM_MODEL=meta/llama-3.1-70b-instruct
```

### 3. Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Run Diagnostic Tests
Every phase includes a self-contained diagnostic test:
```powershell
python test_phase1.py   # Settings & Qdrant connectivity
python test_phase2.py   # Docling layout & HybridChunker
python test_phase3.py   # Dense + Sparse BM25 + NVIDIA Reranker
python test_phase4.py   # XML Grounding & Citation Validator
python test_phase5.py   # FastAPI REST & SSE Streaming endpoints
```

### 5. Launch the System

**Terminal 1 — FastAPI Backend:**
```powershell
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Vite + React Frontend:**
```powershell
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## 📁 Project Architecture

```
Enterprise Knowledge Base/
├── api/
│   └── app.py                   # FastAPI REST and SSE streaming endpoints
├── config/
│   └── settings.py              # Environment settings & configuration loader
├── ingestion/
│   ├── parser.py                # IBM Docling PDF extractor & layout engine
│   ├── chunker.py               # HybridChunker with table & breadcrumb preservation
│   └── pipeline.py              # Ingestion orchestrator with JSON disk caching
├── retrieval/
│   ├── embeddings.py            # NVIDIA NIM Embeddings client (passage vs query)
│   ├── sparse_encoder.py        # FastEmbed BM25 sparse vector tokenizer
│   ├── vector_store.py          # Qdrant client & hybrid collection manager
│   ├── reranker.py              # NVIDIA Cross-Encoder Reranker (Mistral-4B-v3)
│   ├── indexer.py               # PointStruct batch assembler & Qdrant upsert
│   └── hybrid_search.py         # Multi-vector prefetch & RRF search orchestrator
├── generation/
│   ├── prompt_templates.py      # Structured XML grounding prompt schemas
│   ├── citation_validator.py    # Hallucination filter & citation metadata extractor
│   └── generator.py             # NVIDIA NIM LLM inference & SSE token streamer
├── frontend/                    # Apple-designed Vite + React + Tailwind UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Translucent glass header with system status
│   │   │   ├── ChatMessage.jsx       # Message bubble with interactive citation pills
│   │   │   ├── CitationInspector.jsx # Side sheet drawer showing verbatim chunk & table
│   │   │   ├── DocumentDrawer.jsx    # Fluid drag-and-drop PDF uploader
│   │   │   └── ChatInput.jsx         # Bottom action pill with tactile send
│   │   ├── services/
│   │   │   └── api.js                # API & SSE streaming service client
│   │   ├── App.jsx                   # Main chat container & state orchestrator
│   │   └── index.css                 # Apple typography tracking & glass materials
├── docker-compose.yml           # Qdrant container configuration
├── requirements.txt             # Python backend dependencies
└── run_dev.py                   # One-click system launcher
```
