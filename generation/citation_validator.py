# ==============================================================================
# CITATION VALIDATOR MODULE
# This file checks the citations in the LLM's response (e.g. [SRC-1], [SRC-2])
# against the actual chunks we passed to the model.
#
# This guarantees that:
# 1. The LLM never hallucinates citation numbers that didn't exist in the context.
# 2. The frontend gets rich citation metadata to show in the citation side-drawer.
# ==============================================================================

import re
from typing import List, Dict, Any, Tuple


class CitationValidator:
    """
    Validates and extracts source citations from the LLM's generated response.
    """

    @staticmethod
    def extract_and_validate_citations(
        generated_answer: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[Dict[str, Any]], List[str]]:
        """
        BLOCK 1: Extract and Validate Citations
        Parameters:
        - generated_answer: The text output from the LLM
        - retrieved_chunks: The list of chunks provided to the LLM
        
        Returns a tuple:
        - cleaned_answer: The answer with any completely invalid citations sanitized
        - verified_citations: Structured list of citation objects for the frontend
        - hallucinated_tags: List of any tags the model made up (e.g. ['SRC-99'])
        """
        # Step 1: Create a dictionary mapping "SRC-1" -> chunk details
        valid_sources_map: Dict[str, Dict[str, Any]] = {}
        for index, chunk in enumerate(retrieved_chunks, start=1):
            source_id = f"SRC-{index}"
            valid_sources_map[source_id] = {
                "source_id": source_id,
                "file_name": chunk.get("source_file", "unknown.pdf"),
                "page_numbers": chunk.get("page_numbers", [1]),
                "section_headings": chunk.get("section_headings", []),
                "text": chunk.get("text", ""),
                "rerank_score": chunk.get("rerank_score", 0.0),
                "is_table": chunk.get("is_table", False)
            }

        # Step 2: Use regex to find all citation tags like [SRC-1] or [SRC-2]
        citation_pattern = r"\[SRC-(\d+)\]"
        found_matches = re.findall(citation_pattern, generated_answer)

        # ----------------------------------------------------------------------
        # BLOCK 2: Separate verified citations from hallucinated citations
        # ----------------------------------------------------------------------
        verified_citations: List[Dict[str, Any]] = []
        hallucinated_tags: List[str] = []
        seen_source_ids = set()

        for num_str in found_matches:
            tag = f"SRC-{num_str}"
            if tag in valid_sources_map:
                if tag not in seen_source_ids:
                    verified_citations.append(valid_sources_map[tag])
                    seen_source_ids.add(tag)
            else:
                hallucinated_tags.append(tag)

        # ----------------------------------------------------------------------
        # BLOCK 3: Sanitize text if hallucinated tags were produced
        # If the model cited a non-existent tag like [SRC-99], we remove it
        # from the text so the user is not confused.
        # ----------------------------------------------------------------------
        cleaned_answer = generated_answer
        for bad_tag in hallucinated_tags:
            cleaned_answer = cleaned_answer.replace(f"[{bad_tag}]", "")

        return cleaned_answer, verified_citations, hallucinated_tags


# ------------------------------------------------------------------------------
# BLOCK 4: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing Citation Validator ---")
    mock_chunks = [
        {"source_file": "manual.pdf", "page_numbers": [14], "text": "Valve B limit is 5200 PSI."}
    ]
    sample_llm_text = "Valve B has an operating limit of 5200 PSI [SRC-1]. Also see [SRC-99]."
    cleaned, verified, bad = CitationValidator.extract_and_validate_citations(sample_llm_text, mock_chunks)
    print(f"Cleaned Text: {cleaned}")
    print(f"Verified Citations ({len(verified)}): {verified}")
    print(f"Hallucinated Tags: {bad}")
