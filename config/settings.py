# ==============================================================================
# CONFIGURATION SETTINGS MODULE
# This file loads all variables from our .env file and provides them to our app.
# By keeping settings in one place, we avoid hardcoding values across our project.
# ==============================================================================

import os
from pathlib import Path
from dotenv import load_dotenv

# ------------------------------------------------------------------------------
# STEP 1: Find the project root directory and load the .env file
# ------------------------------------------------------------------------------
# Path(__file__) gets the path of this current file (config/settings.py).
# .parent gives us the 'config' folder.
# .parent.parent gives us the root folder: 'c:\Project\Enterprise Knowledge Base'.
BASE_DIR = Path(__file__).resolve().parent.parent

# The path to our .env file in the root directory
ENV_FILE_PATH = BASE_DIR / ".env"

# Load the environment variables from the .env file into Python's os.environ
load_dotenv(dotenv_path=ENV_FILE_PATH)


# ------------------------------------------------------------------------------
# STEP 2: Create a Settings class to hold all configuration variables
# ------------------------------------------------------------------------------
class Settings:
    """
    This class reads each setting from the environment.
    If a setting is missing, it provides a safe default value.
    """

    def __init__(self):
        # --- NVIDIA API Configurations ---
        # Your personal secret key to access NVIDIA cloud endpoints
        self.NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")

        # Base URL for NVIDIA's API catalog (compatible with OpenAI client)
        self.NVIDIA_BASE_URL: str = os.getenv(
            "NVIDIA_BASE_URL", 
            "https://integrate.api.nvidia.com/v1"
        )

        # Model used to create dense embeddings from text
        self.NVIDIA_EMBEDDING_MODEL: str = os.getenv(
            "NVIDIA_EMBEDDING_MODEL", 
            "nvidia/nv-embedqa-e5-v5"
        )

        # Model used to rerank retrieved chunks for higher accuracy
        self.NVIDIA_RERANK_MODEL: str = os.getenv(
            "NVIDIA_RERANK_MODEL", 
            "nvidia/nv-rerankqa-mistral-4b-v3"
        )

        # Large Language Model used to answer questions based on retrieved context
        self.NVIDIA_LLM_MODEL: str = os.getenv(
            "NVIDIA_LLM_MODEL", 
            "nvidia/llama-3.1-nemotron-70b-instruct"
        )

        # --- Qdrant Vector Database Configurations ---
        # Hostname where Qdrant is running (localhost because it is on our machine)
        self.QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")

        # Port number for Qdrant HTTP REST API
        self.QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))

        # The name of our collection inside Qdrant
        self.QDRANT_COLLECTION_NAME: str = os.getenv(
            "QDRANT_COLLECTION_NAME", 
            "enterprise_knowledge_base"
        )

        # Number of dimensions for dense embeddings (1024 for nvidia/nv-embedqa-e5-v5)
        self.DENSE_VECTOR_SIZE: int = int(os.getenv("DENSE_VECTOR_SIZE", "1024"))

        # FastEmbed sparse model name used for BM25 keyword matching
        self.SPARSE_MODEL_NAME: str = "Qdrant/bm25"

    def validate_keys(self) -> bool:
        """
        Helper method to check if the user has provided their real NVIDIA API key.
        NVIDIA API keys always begin with 'nvapi-'.
        Returns True if a real key is present, False otherwise.
        """
        if not self.NVIDIA_API_KEY:
            return False
        key = self.NVIDIA_API_KEY.strip()
        if key == "your_nvidia_api_key_here" or not key.startswith("nvapi-"):
            return False
        return True


# ------------------------------------------------------------------------------
# STEP 3: Create a single global instance of Settings for the app to import
# ------------------------------------------------------------------------------
# Any file in our project can now simply do:
# from config.settings import settings
# print(settings.QDRANT_HOST)
settings = Settings()
