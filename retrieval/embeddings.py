# ==============================================================================
# NVIDIA EMBEDDINGS MODULE
# This file turns plain text into dense numerical vectors (1024 numbers)
# using NVIDIA's cloud models (like nvidia/nv-embedqa-e5-v5).
# ==============================================================================

from typing import List
import numpy as np
import requests

from config.settings import settings


class NVIDIAEmbeddings:
    """
    This class handles generating dense embeddings from NVIDIA's NIM API.
    
    IMPORTANT NVIDIA RULE:
    - When embedding document chunks, we must set input_type="passage".
    - When embedding a user query/question, we must set input_type="query".
    This helps the model understand whether it is indexing data or searching.
    """

    def __init__(self):
        # ----------------------------------------------------------------------
        # BLOCK 1: Setup API credentials and endpoint URL
        # We read the API key and model from our settings.
        # ----------------------------------------------------------------------
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL.rstrip("/")
        self.model_name = settings.NVIDIA_EMBEDDING_MODEL
        self.dimension = settings.DENSE_VECTOR_SIZE

        # Prepare HTTP headers for NVIDIA's API
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _generate_mock_embedding(self, text: str) -> List[float]:
        """
        BLOCK 2: Fallback Mock Embedding (For Offline Testing)
        If you don't have an NVIDIA API key yet or are running tests offline,
        this creates a deterministic 1024-dimension float vector from the text.
        This prevents the program from crashing while you are setting up!
        """
        # Create a repeatable seed from the text string
        seed = sum(ord(c) for c in text) % (2**32)
        rng = np.random.RandomState(seed)
        
        # Generate random numbers and normalize them (standard for cosine distance)
        vec = rng.randn(self.dimension)
        normalized_vec = vec / np.linalg.norm(vec)
        return normalized_vec.tolist()

    def embed_texts(self, texts: List[str], input_type: str = "passage") -> List[List[float]]:
        """
        BLOCK 3: Embed a list of texts
        Parameters:
        - texts: List of strings to embed (e.g., chunks of text)
        - input_type: Either 'passage' (for document chunks) or 'query' (for search questions)
        
        Returns:
        - A list of lists of floats (e.g., [[0.012, -0.045, ...], ...])
        """
        # Step 1: If no real API key is set, use the fallback mock
        if not settings.validate_keys():
            print(f"[NVIDIAEmbeddings] Note: Using mock embeddings (no valid NVIDIA_API_KEY in .env).")
            return [self._generate_mock_embedding(t) for t in texts]

        # Step 2: Prepare the REST API request URL
        # NVIDIA's OpenAI-compatible embeddings endpoint is at /embeddings
        endpoint = f"{self.base_url}/embeddings"

        # Step 3: Call the API in small batches of 16 to avoid payload limits
        batch_size = 16
        all_embeddings: List[List[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            payload = {
                "model": self.model_name,
                "input": batch,
                "input_type": input_type,
                "encoding_format": "float"
            }

            try:
                response = requests.post(
                    endpoint, 
                    headers=self.headers, 
                    json=payload, 
                    timeout=5.0
                )
                response.raise_for_status()
                data = response.json()

                # Extract the vector list from the response data
                for item in data.get("data", []):
                    all_embeddings.append(item["embedding"])

            except Exception as e:
                print(f"[NVIDIAEmbeddings] API call error: {e}")
                print("[NVIDIAEmbeddings] Falling back to mock embeddings for this batch.")
                for t in batch:
                    all_embeddings.append(self._generate_mock_embedding(t))

        return all_embeddings

    def embed_query(self, query_text: str) -> List[float]:
        """
        BLOCK 4: Embed a single search query
        Automatically sets input_type="query".
        """
        results = self.embed_texts([query_text], input_type="query")
        return results[0]

    def embed_passages(self, passage_texts: List[str]) -> List[List[float]]:
        """
        BLOCK 5: Embed a list of document passages
        Automatically sets input_type="passage".
        """
        return self.embed_texts(passage_texts, input_type="passage")


# ------------------------------------------------------------------------------
# BLOCK 6: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing NVIDIA Embeddings ---")
    embedder = NVIDIAEmbeddings()
    sample_text = "Operating pressure tolerance is 3500 PSI."
    vector = embedder.embed_query(sample_text)
    print(f"Generated vector with {len(vector)} dimensions.")
    print(f"First 5 numbers: {vector[:5]}")
