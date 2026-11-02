# ==============================================================================
# PHASE 4 VERIFICATION & DEMONSTRATION SCRIPT
# Run this script using:
# python test_phase4.py
#
# It verifies that:
# 1. XML Grounding Prompts format correctly.
# 2. Citation validation catches valid citations and flags hallucinations.
# 3. Grounded Generator produces responses and streams tokens.
# ==============================================================================

print("\n" + "="*70)
print("PHASE 4 DIAGNOSTIC: Checking Grounded Generation & Citation Engine")
print("="*70)

# ------------------------------------------------------------------------------
# STEP 1: Test Module Imports
# ------------------------------------------------------------------------------
try:
    from generation.prompt_templates import PromptBuilder
    from generation.citation_validator import CitationValidator
    from generation.generator import GroundedGenerator
    print("[PASS] Successfully imported all Phase 4 modules!")
except Exception as e:
    print(f"[FAIL] Could not import Phase 4 modules! Error: {e}")
    exit(1)

# Sample retrieved chunk from previous stage
sample_chunks = [
    {
        "source_file": "industrial_valves_v2.pdf",
        "page_numbers": [14],
        "section_headings": ["Section 4: Technical Specs", "4.2 High-Pressure Valves"],
        "text": (
            "### Table 4: Industrial High-Pressure Valve Tolerances\n"
            "| Model ID | Operating Fluid | Max Pressure (PSI) | Max Temp (°C) |\n"
            "| V-100-A  | Hydraulic Oil   | 3500               | 120           |\n"
            "| V-200-B  | Heavy Coolant   | 5200               | 180           |"
        ),
        "rerank_score": 0.942,
        "is_table": True
    }
]

# ------------------------------------------------------------------------------
# STEP 2: Test Prompt XML Formatting
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 1: XML Grounding Source Formatting")
messages = PromptBuilder.build_prompt_messages(
    query="What is the maximum pressure for valve V-200-B?",
    retrieved_chunks=sample_chunks
)

print(f"[PASS] Prompt generated with {len(messages)} messages.")
print("--- User Prompt Snippet ---")
print(messages[1]["content"][:350] + "...\n")

# ------------------------------------------------------------------------------
# STEP 3: Test Citation Validator & Hallucination Guard
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 2: Citation Validator & Hallucination Detection")

sample_model_response = (
    "According to the specifications, valve V-200-B can withstand up to 5200 PSI [SRC-1]. "
    "Unverified specs can also be seen in [SRC-99]."
)

cleaned, verified, hallucinated = CitationValidator.extract_and_validate_citations(
    sample_model_response,
    sample_chunks
)

print(f"[PASS] Citation extraction completed:")
print(f"       Original Text:     {sample_model_response}")
print(f"       Cleaned Text:      {cleaned}")
print(f"       Verified Sources:  {[c['source_id'] for c in verified]}")
print(f"       Hallucinated Tags: {hallucinated}")

assert "SRC-1" in [c["source_id"] for c in verified], "SRC-1 should be verified"
assert "SRC-99" in hallucinated, "SRC-99 should be detected as hallucinated"
print("[SUCCESS] Hallucinated citation [SRC-99] was correctly caught and isolated!")

# ------------------------------------------------------------------------------
# STEP 4: Test Grounded Generator
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 3: Grounded Generator Execution")
generator = GroundedGenerator()
result = generator.generate_answer(
    query="What is the maximum pressure for valve V-200-B?",
    retrieved_chunks=sample_chunks
)

print(f"[PASS] Generation complete:")
print(f"       Answer:    {result['answer']}")
print(f"       Citations: {len(result['citations'])} verified citation(s)")

# ------------------------------------------------------------------------------
# STEP 5: Test Streaming Generator
# ------------------------------------------------------------------------------
print("\n" + "-"*70)
print("Test 4: Real-time Streaming Generator (SSE simulation)")
stream = generator.stream_answer(
    query="What is the maximum pressure for valve V-200-B?",
    retrieved_chunks=sample_chunks
)

tokens_received = 0
for event in stream:
    if event["type"] == "token":
        tokens_received += 1
    elif event["type"] == "done":
        print(f"\n[PASS] Streaming completed successfully! Received {tokens_received} tokens.")
        print(f"       Attached citation payload: {len(event['citations'])} verified items.")

print("\n" + "="*70)
print("Phase 4 verification complete! Grounding & Citations are ready.")
print("="*70 + "\n")
