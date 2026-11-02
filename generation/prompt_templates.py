# ==============================================================================
# PROMPT TEMPLATES MODULE
# This file formats retrieved document chunks into clean XML source blocks
# and builds a strict, grounded prompt that forces the LLM to cite sources.
# ==============================================================================

from typing import List, Dict, Any


# ------------------------------------------------------------------------------
# BLOCK 1: Grounded System Prompt
# This tells the LLM to act as an accurate enterprise assistant.
# We instruct it to ONLY use the provided sources and cite them as [SRC-1], [SRC-2].
# ------------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an enterprise AI technical assistant. Your job is to answer user questions with absolute factual accuracy based ONLY on the provided context sources.

STRICT GROUNDING RULES:
1. Answer the question using ONLY facts, numbers, specifications, and data directly mentioned in the <source> blocks below.
2. DO NOT assume, extrapolate, or bring in outside knowledge.
3. Every time you state a fact, number, or specification, immediately cite the source using its tag: [SRC-1], [SRC-2], etc.
4. If the provided sources do NOT contain enough information to answer the question, clearly state: "The provided documents do not contain sufficient information to answer this question." Do not attempt to guess.
5. If tables are provided, preserve the exact numbers and units (e.g., PSI, °C, bar).
"""


class PromptBuilder:
    """
    This class converts retrieved chunks and a user question into
    the exact messages payload needed for the LLM.
    """

    @staticmethod
    def format_sources(retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        BLOCK 2: Convert retrieved chunks into structured XML source blocks.
        Each source block receives a simple identifier: SRC-1, SRC-2, etc.
        """
        if not retrieved_chunks:
            return "No sources available."

        sources_xml = []

        for index, chunk in enumerate(retrieved_chunks, start=1):
            source_id = f"SRC-{index}"
            file_name = chunk.get("source_file", "unknown_document.pdf")
            
            # Format page numbers nicely: e.g. "p. 14" or "pp. 14-15"
            pages = chunk.get("page_numbers", [1])
            pages_str = ", ".join(str(p) for p in pages)
            
            # Format heading hierarchy breadcrumbs
            headings = chunk.get("section_headings", [])
            heading_str = " > ".join(headings) if headings else "General"
            
            # Get the verbatim chunk text (which may include markdown tables)
            text_content = chunk.get("text", "").strip()

            # Build the individual XML source block
            source_block = (
                f'<source id="{source_id}" file="{file_name}" pages="{pages_str}" section="{heading_str}">\n'
                f'{text_content}\n'
                f'</source>'
            )
            sources_xml.append(source_block)

        # Join all sources with clean double newlines
        return "\n\n".join(sources_xml)

    @staticmethod
    def build_prompt_messages(query: str, retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        BLOCK 3: Assemble the complete Chat Completion messages list.
        Returns a list of messages formatted for OpenAI / NVIDIA NIM API:
        [
          {"role": "system", "content": "..."},
          {"role": "user", "content": "..."}
        ]
        """
        formatted_context = PromptBuilder.format_sources(retrieved_chunks)

        user_content = (
            f"Here are the retrieved reference documents from our enterprise knowledge base:\n\n"
            f"{formatted_context}\n\n"
            f"--------------------------------------------------\n"
            f"User Question: {query}\n\n"
            f"Please provide a clear, accurate answer with explicit citations (e.g. [SRC-1])."
        )

        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ]


# ------------------------------------------------------------------------------
# BLOCK 4: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing Prompt Builder ---")
    mock_chunks = [
        {
            "chunk_id": "c1",
            "source_file": "valve_spec.pdf",
            "page_numbers": [14],
            "section_headings": ["Specifications", "Valve Limits"],
            "text": "Valve V-200-B maximum pressure is 5200 PSI at 180°C."
        }
    ]
    messages = PromptBuilder.build_prompt_messages("What is the limit for Valve B?", mock_chunks)
    print("Generated User Prompt Content:")
    print(messages[1]["content"])
