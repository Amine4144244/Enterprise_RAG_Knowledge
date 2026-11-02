# ==============================================================================
# QDRANT HYBRID VECTOR STORE MODULE
# This file handles the connection to our Qdrant vector database container.
# It makes sure Qdrant is running and sets up our collection to support
# BOTH Dense Vectors (for semantic meaning) AND Sparse Vectors (for BM25 keywords).
# ==============================================================================

# ------------------------------------------------------------------------------
# BLOCK 0: Safe Import of Qdrant Client
# If the user hasn't run 'pip install -r requirements.txt' yet,
# we catch the ImportError so test scripts give friendly guidance.
# ------------------------------------------------------------------------------
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    QDRANT_INSTALLED = True
except ImportError:
    QdrantClient = None
    models = None
    QDRANT_INSTALLED = False

# Import our settings loaded from .env
from config.settings import settings


class QdrantVectorStore:
    """
    This class manages all operations with Qdrant:
    1. Connecting to the Qdrant container.
    2. Checking if Qdrant is healthy.
    3. Creating the hybrid collection if it doesn't exist yet.
    """

    def __init__(self):
        # ----------------------------------------------------------------------
        # BLOCK 1: Create the Qdrant Client connection
        # We tell QdrantClient where our Qdrant container is running.
        # Default is host="localhost" and port=6333.
        # ----------------------------------------------------------------------
        if not QDRANT_INSTALLED:
            print("[Qdrant] WARNING: 'qdrant-client' is not installed in Python.")
            print("         Run: pip install qdrant-client")
            self.client = None
            self.collection_name = settings.QDRANT_COLLECTION_NAME
            return

        print(f"[Qdrant] Connecting to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}...")
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            timeout=0.5  # Fast 0.5s check so fallback to local disk is instant if Docker is off
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def check_connection(self) -> bool:
        """
        BLOCK 2: Health Check Function
        This function tests if the Qdrant container is responding to requests.
        Returns True if connected, or False if Docker or Qdrant is down.
        """
        if not QDRANT_INSTALLED or self.client is None:
            return False

        try:
            # We call get_collections() as a simple ping test
            collections = self.client.get_collections()
            print(f"[Qdrant] Success! Connected to Qdrant. Found {len(collections.collections)} collections.")
            return True
        except Exception as error:
            # If Docker container is not running, seamlessly fall back to local disk storage
            print("[Qdrant] Note: Docker container not responding at localhost:6333.")
            print("[Qdrant] Switching to local embedded storage mode ('./qdrant_storage')...")
            try:
                self.client = QdrantClient(path="./qdrant_storage")
                collections = self.client.get_collections()
                print(f"[Qdrant] Success! Running in embedded local disk mode (No Docker required).")
                return True
            except Exception as e2:
                print(f"[Qdrant] Could not connect to Docker or local storage: {e2}")
                return False

    def create_hybrid_collection(self) -> bool:
        """
        BLOCK 3: Create the Hybrid Collection (Dense + Sparse)
        In Qdrant, a 'collection' is like a database table.
        To do hybrid search, we configure TWO named vector spaces in the same collection:
        1. 'dense': stores 1024-number embeddings from NVIDIA for semantic search.
        2. 'sparse': stores BM25 keyword weights for exact numbers and technical terms.
        """
        # First, verify that we can talk to Qdrant
        if not self.check_connection():
            return False

        try:
            # Check if our collection already exists
            collection_exists = self.client.collection_exists(collection_name=self.collection_name)

            if collection_exists:
                print(f"[Qdrant] Collection '{self.collection_name}' already exists. Ready to use!")
                return True

            # If it does not exist, let's create it with our hybrid configuration
            print(f"[Qdrant] Creating new hybrid collection: '{self.collection_name}'...")

            # ------------------------------------------------------------------
            # DENSE VECTOR CONFIGURATION:
            # - size: 1024 dimensions (matches NVIDIA nv-embedqa-e5-v5)
            # - distance: COSINE measures the angle between vectors (standard for text)
            # ------------------------------------------------------------------
            dense_vectors_config = {
                "dense": models.VectorParams(
                    size=settings.DENSE_VECTOR_SIZE,
                    distance=models.Distance.COSINE
                )
            }

            # ------------------------------------------------------------------
            # SPARSE VECTOR CONFIGURATION:
            # - modifier=models.Modifier.IDF applies Inverse Document Frequency
            #   so rare words (like part numbers) get higher importance
            # ------------------------------------------------------------------
            sparse_vectors_config = {
                "sparse": models.SparseVectorParams(
                    modifier=models.Modifier.IDF
                )
            }

            # Now call Qdrant to create the collection with both vector types
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=dense_vectors_config,
                sparse_vectors_config=sparse_vectors_config
            )

            print(f"[Qdrant] Hybrid collection '{self.collection_name}' was successfully created!")
            return True

        except Exception as error:
            print(f"[Qdrant] ERROR creating collection: {error}")
            return False

    def get_collection_info(self) -> dict:
        """
        BLOCK 4: Get Collection Statistics
        This function returns information about the collection, like how many
        documents/vectors are stored in it. Useful for our frontend dashboard!
        """
        if not self.check_connection():
            return {
                "status": "offline",
                "collection_name": self.collection_name,
                "points_count": 0,
                "indexed_vectors_count": 0,
            }

        try:
            info = self.client.get_collection(collection_name=self.collection_name)
            return {
                "status": "ready",
                "collection_name": self.collection_name,
                "points_count": info.points_count,
                "indexed_vectors_count": info.indexed_vectors_count,
            }
        except Exception:
            return {
                "status": "ready",
                "collection_name": self.collection_name,
                "points_count": 0,
                "indexed_vectors_count": 0,
            }


# ------------------------------------------------------------------------------
# BLOCK 5: Standalone test execution
# If you run this file directly with 'python retrieval/vector_store.py',
# it will test the connection and create the collection.
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing Qdrant Hybrid Vector Store ---")
    store = QdrantVectorStore()
    connected = store.check_connection()
    if connected:
        store.create_hybrid_collection()
        info = store.get_collection_info()
        print(f"Collection stats: {info}")
