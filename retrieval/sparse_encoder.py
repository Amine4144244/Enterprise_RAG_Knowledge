# ==============================================================================
# SPARSE BM25 ENCODER MODULE
# This file turns plain text into sparse vectors (word index + weight)
# using BM25 keyword matching via FastEmbed.
#
# Sparse vectors are the secret weapon for exact keyword matches:
# part numbers (e.g. 'V-200-B'), error codes ('0x80040154'), and exact numbers!
# ==============================================================================

from typing import List, Dict, Any, Tuple
import re

# ------------------------------------------------------------------------------
# BLOCK 1: Safe Import of FastEmbed and Qdrant models
# FastEmbed produces lightweight BM25 sparse vectors directly on your CPU.
# If qdrant-client is not yet installed, we provide a lightweight mock dataclass.
# ------------------------------------------------------------------------------
try:
    from fastembed import SparseTextEmbedding
    FASTEMBED_AVAILABLE = True
except ImportError:
    FASTEMBED_AVAILABLE = False

try:
    from qdrant_client.http import models
except ImportError:
    class MockSparseVector:
        def __init__(self, indices: List[int], values: List[float]):
            self.indices = indices
            self.values = values
    class MockModels:
        SparseVector = MockSparseVector
    models = MockModels()


class SparseBM25Encoder:
    """
    This class converts text into Qdrant SparseVector objects.
    A sparse vector looks like:
        indices: [1420, 8931, 4012]   (unique IDs representing the words)
        values:  [1.85, 0.42, 2.10]   (how important each word is in this text)
    """

    def __init__(self, model_name: str = "Qdrant/bm25"):
        # ----------------------------------------------------------------------
        # BLOCK 2: Initialize FastEmbed Sparse Model
        # By default, we use 'Qdrant/bm25', which is tiny, fast, and runs on CPU.
        # ----------------------------------------------------------------------
        self.model_name = model_name

        if FASTEMBED_AVAILABLE:
            print(f"[SparseEncoder] Loading FastEmbed sparse model: '{self.model_name}'...")
            try:
                self.model = SparseTextEmbedding(model_name=self.model_name)
                print("[SparseEncoder] FastEmbed model loaded successfully!")
            except Exception as e:
                print(f"[SparseEncoder] Warning: Could not download FastEmbed model ({e}). Using fallback.")
                self.model = None
        else:
            print("[SparseEncoder] FastEmbed is not installed. Using fallback token hasher.")
            self.model = None

    def _fallback_sparse_vector(self, text: str) -> models.SparseVector:
        """
        BLOCK 3: Simple Token Hasher Fallback
        If FastEmbed is not installed or network is offline, this extracts
        alphanumeric words, hashes them into 32-bit integer indices, and counts frequencies.
        This ensures our code works even before downloading heavy packages!
        """
        # Find all alphanumeric tokens and lower-case them
        tokens = re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())
        if not tokens:
            return models.SparseVector(indices=[1], values=[1.0])

        counts: Dict[int, float] = {}
        for token in tokens:
            # Hash each token into an integer between 1 and 1,000,000
            token_index = abs(hash(token)) % 1_000_000
            counts[token_index] = counts.get(token_index, 0.0) + 1.0

        # Sort indices in ascending order (required by Qdrant sparse vectors)
        sorted_indices = sorted(counts.keys())
        sorted_values = [counts[idx] for idx in sorted_indices]

        return models.SparseVector(
            indices=sorted_indices,
            values=sorted_values
        )

    def encode_texts(self, texts: List[str]) -> List[models.SparseVector]:
        """
        BLOCK 4: Encode a list of texts into Qdrant SparseVector objects.
        """
        # If FastEmbed is loaded, use its official BM25 model
        if self.model is not None:
            try:
                # FastEmbed returns an iterator of SparseEmbedding objects
                embeddings_gen = self.model.embed(texts)
                sparse_vectors = []
                for emb in embeddings_gen:
                    sparse_vectors.append(
                        models.SparseVector(
                            indices=emb.indices.tolist(),
                            values=emb.values.tolist()
                        )
                    )
                return sparse_vectors
            except Exception as e:
                print(f"[SparseEncoder] FastEmbed error: {e}. Using fallback.")

        # Fallback if FastEmbed is unavailable
        return [self._fallback_sparse_vector(t) for t in texts]

    def encode_query(self, query: str) -> models.SparseVector:
        """
        BLOCK 5: Encode a single search query into a SparseVector.
        """
        results = self.encode_texts([query])
        return results[0]


# ------------------------------------------------------------------------------
# BLOCK 6: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing Sparse BM25 Encoder ---")
    encoder = SparseBM25Encoder()
    test_text = "Valve model V-200-B maximum pressure tolerance: 5200 PSI"
    sparse_vec = encoder.encode_query(test_text)
    print(f"Indices ({len(sparse_vec.indices)} tokens): {sparse_vec.indices[:5]}")
    print(f"Values:  {sparse_vec.values[:5]}")
