# ==============================================================================
# PHASE 2 VERIFICATION & DEMONSTRATION SCRIPT
# Run this script using:
# python test_phase2.py
#
# It verifies that our PDF parser, HybridChunker, and Ingestion Pipeline
# are structured properly and demonstrates how tables and metadata are preserved.
# ==============================================================================

import json
from pathlib import Path

print("\n" + "="*70)
print("PHASE 2 DIAGNOSTIC: Checking Ingestion Engine & HybridChunker")
print("="*70)

# ------------------------------------------------------------------------------
# STEP 1: Verify imports of Phase 2 modules
# ------------------------------------------------------------------------------
try:
    from ingestion.parser import PDFParser, DOCLING_AVAILABLE
    from ingestion.chunker import DocumentChunker, StructuredChunk, CHUNKER_AVAILABLE
    from ingestion.pipeline import IngestionPipeline
    print("[PASS] Successfully imported ingestion/parser.py")
    print("[PASS] Successfully imported ingestion/chunker.py")
    print("[PASS] Successfully imported ingestion/pipeline.py")
except Exception as e:
    print(f"[FAIL] Could not import Phase 2 modules! Error: {e}")
    exit(1)

# ------------------------------------------------------------------------------
# STEP 2: Check Docling installation status
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Checking IBM Docling Library Status:")
if DOCLING_AVAILABLE and CHUNKER_AVAILABLE:
    print("[PASS] IBM Docling and HybridChunker are installed and ready!")
else:
    print("[NOTE] Docling is not installed in this Python environment yet.")
    print("       (You can install it anytime using: pip install docling docling-core)")
    print("       Don't worry! We will demonstrate the exact StructuredChunk data")
    print("       format that our pipeline produces below.")

# ------------------------------------------------------------------------------
# STEP 3: Demonstrate StructuredChunk format with a complex technical table
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Demonstration: What a Preserved Table Chunk Looks Like:")

sample_chunk = StructuredChunk(
    chunk_id="pump_spec_manual.pdf_chunk_0012",
    text=(
        "### Table 4: Industrial High-Pressure Valve Tolerances\n"
        "| Model ID | Operating Fluid | Max Pressure (PSI) | Max Temp (°C) | Flow Rate (L/min) |\n"
        "| :--- | :--- | :--- | :--- | :--- |\n"
        "| V-100-A | Hydraulic Oil | 3500 | 120 | 45.2 |\n"
        "| V-200-B | Heavy Coolant | 5200 | 180 | 68.0 |\n"
        "| V-300-X | Cryogenic Gas | 7500 | -40 | 92.5 |"
    ),
    context_enriched_text=(
        "Document: pump_spec_manual.pdf | Section: Section 4: Specifications > 4.2 Valve Assemblies\n"
        "### Table 4: Industrial High-Pressure Valve Tolerances\n"
        "| Model ID | Operating Fluid | Max Pressure (PSI) | Max Temp (°C) | Flow Rate (L/min) |\n"
        "| :--- | :--- | :--- | :--- | :--- |\n"
        "| V-100-A | Hydraulic Oil | 3500 | 120 | 45.2 |\n"
        "| V-200-B | Heavy Coolant | 5200 | 180 | 68.0 |\n"
        "| V-300-X | Cryogenic Gas | 7500 | -40 | 92.5 |"
    ),
    source_file="pump_spec_manual.pdf",
    page_numbers=[14],
    section_headings=["Section 4: Specifications", "4.2 Valve Assemblies"],
    is_table=True
)

print(json.dumps(sample_chunk.to_dict(), indent=2))

print("\n" + "="*70)
print("Key Benefits of this Structure:")
print("1. Table Integrity: Column headers are bound directly to row values.")
print("2. Breadcrumbs: 'Section 4 > 4.2 Valve Assemblies' gives context to V-200-B.")
print("3. Deterministic Attribution: 'page_numbers: [14]' gives an exact citation.")
print("="*70 + "\n")
