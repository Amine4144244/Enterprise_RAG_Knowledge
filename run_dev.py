# ==============================================================================
# ENTERPRISE RAG DEVELOPMENT RUNNER
# Run this script using:
# python run_dev.py
#
# It checks system health and provides one-click launch commands for both
# the FastAPI backend and the Vite + React frontend!
# ==============================================================================

import sys
import subprocess
import os

print("\n" + "="*70)
print("🚀 ENTERPRISE RAG KNOWLEDGE BASE — SYSTEM LAUNCHER")
print("="*70)

# Check configuration
from config.settings import settings

print(f"Backend API Host:  http://127.0.0.1:8001")
print(f"Frontend Dev Host: http://localhost:5173")
print(f"Qdrant DB Host:    http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
print(f"NVIDIA Model:      {settings.NVIDIA_LLM_MODEL}")

print("\n" + "-"*70)
print("HOW TO RUN THE COMPLETE SYSTEM:")
print("-"*70)

print("""
STEP 1: Start the FastAPI Backend Server (Terminal 1)
    python -m uvicorn api.app:app --host 127.0.0.1 --port 8001 --reload

STEP 2: Start the Vite + React Frontend (Terminal 2)
    cd frontend
    npm run dev

Then open your browser at:
    👉 http://localhost:5173
""")

print("="*70 + "\n")
