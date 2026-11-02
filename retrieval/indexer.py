# ==============================================================================
# DOCUMENT INDEXER MODULE
# This file takes the StructuredChunks from Docling, computes BOTH:
# 1. NVIDIA Dense Embeddings (for semantic concepts)
# 2. FastEmbed Sparse BM25 Vectors (for keywords and numbers)
# and uploads them into our Qdrant hybrid collection.
# ==============================================================================

import uuid
from typing import List
try:
    from qdrant_client.http import models
except ImportError:
    models = None

from config.settings import settings
from ingestion.chunker import StructuredChunk
from retrieval.embeddings import NVIDIAEmbeddings
from retrieval.sparse_encoder import SparseBM25Encoder
from retrieval.vector_store import QdrantVectorStore


class DocumentIndexer:
    """
    This class coordinates vector creation and indexing into Qdrant.
    """

    def __init__(self, store=None):
        # ----------------------------------------------------------------------
        # BLOCK 1: Initialize all components
        # We share the Qdrant store instance so we don't duplicate connections.
        # ----------------------------------------------------------------------
        self.store = store or QdrantVectorStore()
        self.dense_embedder = NVIDIAEmbeddings()
        self.sparse_encoder = SparseBM25Encoder()
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def index_chunks(self, chunks: List[StructuredChunk], batch_size: int = 16) -> bool:
        """
        BLOCK 2: Main Indexing Function
        Takes a list of StructuredChunk objects, computes vectors in batches,
        and upserts them into Qdrant.
        """
        if not chunks:
            print("[Indexer] Warning: No chunks provided to index.")
            return False

        # Ensure Qdrant collection exists before inserting points
        self.store.create_hybrid_collection()

        print(f"[Indexer] Starting indexing for {len(chunks)} chunks...")

        # Process chunks in manageable batches
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            print(f"[Indexer] Processing batch {i // batch_size + 1} ({len(batch)} chunks)...")

            # ------------------------------------------------------------------
            # BLOCK 3: Generate Dense Vectors using NVIDIA Embeddings
            # We embed the 'context_enriched_text' so the vector carries the
            # document title and section headings!
            # ------------------------------------------------------------------
            texts_to_embed = [c.context_enriched_text for c in batch]
            dense_vectors = self.dense_embedder.embed_passages(texts_to_embed)

            # ------------------------------------------------------------------
            # BLOCK 4: Generate Sparse Vectors using FastEmbed BM25
            # We encode the raw chunk text so keywords and numbers are indexed.
            # ------------------------------------------------------------------
            raw_texts = [c.text for c in batch]
            sparse_vectors = self.sparse_encoder.encode_texts(raw_texts)

            # ------------------------------------------------------------------
            # BLOCK 5: Assemble Qdrant PointStructs
            # Each point in Qdrant has:
            # - id: Unique UUID
            # - vector: Dictionary with named vectors {'dense': ..., 'sparse': ...}
            # - payload: Metadata (chunk_id, text, source_file, page_numbers, etc.)
            # ------------------------------------------------------------------
            points = []
            for j, chunk in enumerate(batch):
                # Generate a stable UUID based on chunk_id so re-indexing doesn't create duplicates
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.chunk_id))

                point = models.PointStruct(
                    id=point_id,
                    vector={
                        "dense": dense_vectors[j],
                        "sparse": sparse_vectors[j]
                    },
                    payload={
                        "chunk_id": chunk.chunk_id,
                        "text": chunk.text,
                        "context_enriched_text": chunk.context_enriched_text,
                        "source_file": chunk.source_file,
                        "page_numbers": chunk.page_numbers,
                        "section_headings": chunk.section_headings,
                        "is_table": chunk.is_table
                    }
                )
                points.append(point)

            # ------------------------------------------------------------------
            # BLOCK 6: Upsert points into Qdrant
            # ------------------------------------------------------------------
            try:
                self.store.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                print(f"[Indexer] Successfully indexed batch of {len(points)} points into Qdrant.")
            except Exception as e:
                print(f"[Indexer] Error upserting points to Qdrant: {e}")
                return False

        print(f"[Indexer] Indexing complete! All {len(chunks)} chunks are now stored in Qdrant.")
        return True


# ------------------------------------------------------------------------------
# BLOCK 7: Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Document Indexer Ready ---")
    indexer = DocumentIndexer()
    print("Indexer initialized successfully.")
