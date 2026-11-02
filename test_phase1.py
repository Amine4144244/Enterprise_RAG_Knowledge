# ==============================================================================
# PHASE 1 VERIFICATION & DIAGNOSTIC SCRIPT
# Run this script using:
# python test_phase1.py
#
# It verifies that your environment variables, settings, and Qdrant container
# are correctly configured before we move on to Phase 2 (Docling parsing).
# ==============================================================================

import sys

# ------------------------------------------------------------------------------
# STEP 1: Test settings import
# ------------------------------------------------------------------------------
print("\n" + "="*70)
print("PHASE 1 DIAGNOSTIC: Checking Environment, Settings & Qdrant")
print("="*70)

try:
    from config.settings import settings
    print("[PASS] Successfully imported config/settings.py")
    print(f"       -> Qdrant Host: {settings.QDRANT_HOST}")
    print(f"       -> Qdrant Port: {settings.QDRANT_PORT}")
    print(f"       -> Collection:  {settings.QDRANT_COLLECTION_NAME}")
    print(f"       -> Dense Model: {settings.NVIDIA_EMBEDDING_MODEL}")
    print(f"       -> LLM Model:   {settings.NVIDIA_LLM_MODEL}")
except Exception as e:
    print(f"[FAIL] Could not import config/settings.py! Error: {e}")
    sys.exit(1)

# ------------------------------------------------------------------------------
# STEP 2: Check NVIDIA API key status
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Checking NVIDIA API Key:")
if settings.validate_keys():
    print("[PASS] NVIDIA_API_KEY is detected in your .env file.")
else:
    print("[WARN] NVIDIA_API_KEY is currently empty or set to placeholder!")
    print("       Remember to get a free key from https://build.nvidia.com")
    print("       and paste it into your .env file.")

# ------------------------------------------------------------------------------
# STEP 3: Test connection to the Qdrant container
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Checking Qdrant Docker Container Connection:")

try:
    from retrieval.vector_store import QdrantVectorStore
    store = QdrantVectorStore()
    connected = store.check_connection()

    if connected:
        print("[PASS] Qdrant container is reachable and responding!")
        created = store.create_hybrid_collection()
        if created:
            info = store.get_collection_info()
            print(f"[PASS] Hybrid collection '{settings.QDRANT_COLLECTION_NAME}' is ready.")
            print(f"       Current points in database: {info.get('points_count', 0)}")
    else:
        print("\n[NOTE] Qdrant container is not running yet.")
        print("To start Qdrant in Docker, open a terminal and run:")
        print("    docker compose up -d")
        print("Once the container starts, re-run this test script.")

except ImportError as e:
    print(f"[NOTE] Missing Python packages: {e}")
    print("Please install requirements using:")
    print("    pip install -r requirements.txt")

print("\n" + "="*70)
print("Phase 1 verification check completed.")
print("="*70 + "\n")
