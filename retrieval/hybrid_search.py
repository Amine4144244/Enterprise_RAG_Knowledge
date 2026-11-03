# ==============================================================================
# HYBRID RETRIEVAL & RERANKING ORCHESTRATOR
# This file executes the complete 2-stage search:
# Stage 1: Hybrid Search in Qdrant (Dense Semantic + Sparse BM25 via RRF)
# Stage 2: Cross-Encoder Reranking using NVIDIA (nv-rerankqa-mistral-4b-v3)
# ==============================================================================

from typing import List, Dict, Any, Optional
try:
    from qdrant_client.http import models
except ImportError:
    models = None

from config.settings import settings
from retrieval.vector_store import QdrantVectorStore
from retrieval.embeddings import NVIDIAEmbeddings
from retrieval.sparse_encoder import SparseBM25Encoder
from retrieval.reranker import NVIDIAReranker


class HybridRetriever:
    """
    This class combines Qdrant hybrid retrieval with NVIDIA cross-encoder reranking.
    """

    def __init__(self, store=None):
        # ----------------------------------------------------------------------
        # BLOCK 1: Initialize all retrieval and reranking services
        # ----------------------------------------------------------------------
        self.store = store or QdrantVectorStore()
        self.dense_embedder = NVIDIAEmbeddings()
        self.sparse_encoder = SparseBM25Encoder()
        self.reranker = NVIDIAReranker()
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def search(
        self, 
        query: str, 
        candidate_pool_size: int = 20, 
        top_k: int = 5,
        filter_doc: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        BLOCK 2: Main Hybrid Search & Rerank Function
        
        Parameters:
        - query: The user's search question
        - candidate_pool_size: How many candidates to fetch from Qdrant (Stage 1, default 20)
        - top_k: How many high-precision chunks to keep after NVIDIA reranking (Stage 2, default 5)
        - filter_doc: Optional document filename to limit search to a specific PDF
        """
        print(f"\n[HybridRetriever] Processing search query: '{query}'...")

        # ----------------------------------------------------------------------
        # BLOCK 3: Step 1 - Generate Query Vectors (Dense & Sparse)
        # ----------------------------------------------------------------------
        # Dense vector captures the semantic concept (e.g. what valves are designed for)
        dense_query = self.dense_embedder.embed_query(query)

        # Sparse vector captures exact numbers and keywords (e.g. "V-200-B", "5200 PSI")
        sparse_query = self.sparse_encoder.encode_query(query)

        # ----------------------------------------------------------------------
        # BLOCK 4: Step 2 - Execute Qdrant Hybrid Search (RRF Fusion)
        # Reciprocal Rank Fusion (RRF) merges dense and sparse results server-side.
        # ----------------------------------------------------------------------
        candidates: List[Dict[str, Any]] = []

        try:
            # Build an optional metadata filter if filter_doc is provided
            query_filter = None
            if filter_doc:
                query_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="source_file",
                            match=models.MatchValue(value=filter_doc)
                        )
                    ]
                )

            # Define prefetch queries for both dense and sparse vectors
            prefetch = [
                models.Prefetch(
                    query=dense_query,
                    using="dense",
                    limit=candidate_pool_size,
                    filter=query_filter
                ),
                models.Prefetch(
                    query=sparse_query,
                    using="sparse",
                    limit=candidate_pool_size,
                    filter=query_filter
                )
            ]

            # Run the hybrid search using Reciprocal Rank Fusion (RRF)
            search_response = self.store.client.query_points(
                collection_name=self.collection_name,
                prefetch=prefetch,
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=candidate_pool_size
            )

            # Unpack the points and their payloads into a clean list of dictionaries
            for point in search_response.points:
                payload = dict(point.payload or {})
                payload["point_id"] = str(point.id)
                payload["initial_score"] = round(float(point.score or 0.0), 4)
                candidates.append(payload)

            print(f"[HybridRetriever] Stage 1 (Qdrant RRF) fetched {len(candidates)} candidate chunks.")

        except Exception as e:
            print(f"[HybridRetriever] Qdrant search error: {e}")
            return []

        # If Qdrant found no chunks, return an empty list
        if not candidates:
            print("[HybridRetriever] No candidate chunks found in Qdrant.")
            return []

        # ----------------------------------------------------------------------
        # BLOCK 5: Step 3 - Stage 2: Cross-Encoder Reranking
        # The cross-encoder re-evaluates all candidates alongside the query,
        # placing the exact matching specifications and tables at the very top.
        # ----------------------------------------------------------------------
        print(f"[HybridRetriever] Stage 2: Reranking Top-{len(candidates)} candidates via NVIDIA Cross-Encoder...")
        reranked_chunks = self.reranker.rerank(
            query=query, 
            candidates=candidates, 
            top_n=top_k
        )

        # Ensure consistent source identifiers (SRC-1, SRC-2, ...) for UI citation binding
        for idx, chunk in enumerate(reranked_chunks):
            chunk["source_id"] = f"SRC-{idx + 1}"

        print(f"[HybridRetriever] Search complete! Returning top {len(reranked_chunks)} verified chunks.")
        return reranked_chunks


# ------------------------------------------------------------------------------
# BLOCK 6: Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Hybrid Retriever Ready ---")
    retriever = HybridRetriever()
    print("Hybrid retriever initialized.")
