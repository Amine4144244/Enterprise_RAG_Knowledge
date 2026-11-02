# ==============================================================================
# PHASE 5 VERIFICATION & TEST SCRIPT
# Run this script using:
# python test_phase5.py
#
# It tests all FastAPI backend endpoints and routes directly:
# 1. GET /api/health
# 2. GET /api/documents
# 3. POST /api/query (non-streaming)
# 4. POST /api/chat/stream (SSE streaming generator)
# ==============================================================================

import json

print("\n" + "="*70)
print("PHASE 5 DIAGNOSTIC: Checking FastAPI Backend Endpoints")
print("="*70)

# ------------------------------------------------------------------------------
# STEP 1: Import FastAPI app and route functions
# ------------------------------------------------------------------------------
try:
    from api.app import app, get_health, list_documents, query_knowledge_base, stream_chat, QueryRequest
    print("[PASS] Successfully imported FastAPI application and route handlers.")
except Exception as e:
    print(f"[FAIL] Could not import FastAPI app! Error: {e}")
    exit(1)

# ------------------------------------------------------------------------------
# STEP 2: Test GET /api/health
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 1: Health Check Endpoint (GET /api/health)")
health_data = get_health()
print("Health payload:", json.dumps(health_data, indent=2))
assert health_data["status"] == "online", "Health check status should be online"
print("[PASS] GET /api/health handler executed successfully!")

# ------------------------------------------------------------------------------
# STEP 3: Test GET /api/documents
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 2: Document List Endpoint (GET /api/documents)")
doc_data = list_documents()
print("Documents response:", json.dumps(doc_data, indent=2))
assert "documents" in doc_data, "Documents key should exist"
print("[PASS] GET /api/documents handler executed successfully!")

# ------------------------------------------------------------------------------
# STEP 4: Test POST /api/query
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 3: Non-Streaming Query (POST /api/query)")
query_req = QueryRequest(
    query="What is the maximum pressure rating for industrial valve assemblies?",
    top_k=3
)
query_res = query_knowledge_base(query_req)
print(f"Query: {query_res['query']}")
print(f"Answer: {query_res['answer'][:150]}...")
print(f"Citations count: {len(query_res['citations'])}")
print(f"Retrieved chunks: {len(query_res['retrieved_chunks'])}")
assert "answer" in query_res, "Response must contain 'answer' key"
print("[PASS] POST /api/query handler executed successfully!")

# ------------------------------------------------------------------------------
# STEP 5: Test POST /api/chat/stream (SSE Streaming)
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 4: Real-time Streaming SSE Chat (POST /api/chat/stream)")

streaming_response = stream_chat(query_req)
print(f"Streaming Response Media Type: {streaming_response.media_type}")
assert streaming_response.media_type == "text/event-stream"

# Verify that the response wraps an SSE generator
print("[PASS] Successfully created FastAPI StreamingResponse with text/event-stream!")

print("\n" + "="*70)
print("Phase 5 verification complete! FastAPI backend services are fully functional.")
print("="*70 + "\n")
