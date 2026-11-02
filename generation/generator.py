# ==============================================================================
# NVIDIA LLM GENERATION MODULE
# This file calls NVIDIA NIM's Large Language Model (meta/llama-3.1-70b-instruct)
# to generate grounded answers with explicit citations.
#
# It supports both standard responses AND real-time token streaming for the UI!
# ==============================================================================

import json
from typing import List, Dict, Any, Generator, Tuple
import requests

from config.settings import settings
from generation.prompt_templates import PromptBuilder
from generation.citation_validator import CitationValidator


class GroundedGenerator:
    """
    This class handles generating answers using NVIDIA's cloud LLM endpoints.
    """

    def __init__(self):
        # ----------------------------------------------------------------------
        # BLOCK 1: Setup API credentials and configuration
        # ----------------------------------------------------------------------
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL.rstrip("/")
        self.model_name = settings.NVIDIA_LLM_MODEL

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _fallback_generate(self, query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        BLOCK 2: Fallback Mock Generation (For Offline Testing)
        If the NVIDIA API key is not yet set or when running offline,
        this produces a grounded answer based on the top retrieved chunk.
        """
        if not retrieved_chunks:
            return "The provided documents do not contain sufficient information to answer this question."

        top_chunk = retrieved_chunks[0]
        text_snippet = top_chunk.get("text", "").strip()
        doc = top_chunk.get("source_file", "document.pdf")
        page = top_chunk.get("page_numbers", [1])[0]

        return (
            f"Based on the enterprise documentation in {doc} (page {page}), "
            f"here is the relevant specification [SRC-1]:\n\n"
            f"> {text_snippet}"
        )

    def generate_answer(
        self, 
        query: str, 
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        BLOCK 3: Non-Streaming Answer Generation
        Sends the grounded prompt to NVIDIA NIM LLM and returns the complete answer
        along with verified citation metadata.
        """
        # If no valid API key is set, use the fallback mock
        if not settings.validate_keys():
            raw_text = self._fallback_generate(query, retrieved_chunks)
            cleaned_text, citations, _ = CitationValidator.extract_and_validate_citations(
                raw_text, retrieved_chunks
            )
            return {
                "answer": cleaned_text,
                "citations": citations,
                "model": "offline-fallback"
            }

        # Build prompt messages formatted with <source> XML blocks
        messages = PromptBuilder.build_prompt_messages(query, retrieved_chunks)

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,       # Low temperature prevents creative hallucination
            "max_tokens": 1024,
            "top_p": 0.7
        }

        endpoint = f"{self.base_url}/chat/completions"

        try:
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=payload,
                timeout=5.0
            )
            response.raise_for_status()
            data = response.json()

            # Extract the generated text
            raw_answer = data["choices"][0]["message"]["content"]

            # Validate citations against our retrieved chunks
            cleaned_answer, verified_citations, hallucinated = (
                CitationValidator.extract_and_validate_citations(
                    raw_answer, retrieved_chunks
                )
            )

            return {
                "answer": cleaned_answer,
                "citations": verified_citations,
                "hallucinated_citations": hallucinated,
                "model": self.model_name
            }

        except Exception as e:
            print(f"[GroundedGenerator] API call error: {e}. Using fallback.")
            raw_text = self._fallback_generate(query, retrieved_chunks)
            cleaned_text, citations, _ = CitationValidator.extract_and_validate_citations(
                raw_text, retrieved_chunks
            )
            return {
                "answer": cleaned_text,
                "citations": citations,
                "model": "fallback-after-error"
            }

    def stream_answer(
        self, 
        query: str, 
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Generator[Dict[str, Any], None, None]:
        """
        BLOCK 4: Real-time Streaming Generation (For Server-Sent Events / SSE)
        Yields tokens one by one as they are generated by NVIDIA NIM LLM.
        At the end, yields a final event with the verified citation metadata!
        """
        # If API key is not set, simulate streaming using fallback text
        if not settings.validate_keys():
            raw_text = self._fallback_generate(query, retrieved_chunks)
            # Yield word by word to simulate streaming
            words = raw_text.split(" ")
            for w in words:
                yield {"type": "token", "content": w + " "}
            
            # Yield final citation metadata
            _, citations, _ = CitationValidator.extract_and_validate_citations(
                raw_text, retrieved_chunks
            )
            yield {"type": "done", "citations": citations}
            return

        messages = PromptBuilder.build_prompt_messages(query, retrieved_chunks)
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
            "stream": True            # Tells NVIDIA to stream tokens as they are produced
        }

        endpoint = f"{self.base_url}/chat/completions"
        full_text_accumulator: List[str] = []

        try:
            with requests.post(
                endpoint,
                headers=self.headers,
                json=payload,
                stream=True,
                timeout=5.0
            ) as response:
                response.raise_for_status()

                # Process Server-Sent Events from NVIDIA
                for line in response.iter_lines():
                    if not line:
                        continue
                    
                    decoded_line = line.decode("utf-8")
                    if decoded_line.startswith("data: "):
                        json_str = decoded_line[6:].strip()
                        if json_str == "[DONE]":
                            break
                        
                        try:
                            chunk_data = json.loads(json_str)
                            delta = chunk_data["choices"][0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                full_text_accumulator.append(token)
                                yield {"type": "token", "content": token}
                        except Exception:
                            continue

            # Validate citations from the accumulated text
            full_text = "".join(full_text_accumulator)
            _, verified_citations, _ = CitationValidator.extract_and_validate_citations(
                full_text, retrieved_chunks
            )
            yield {"type": "done", "citations": verified_citations}

        except Exception as e:
            print(f"[GroundedGenerator] Streaming error: {e}. Yielding fallback.")
            raw_text = self._fallback_generate(query, retrieved_chunks)
            yield {"type": "token", "content": raw_text}
            _, citations, _ = CitationValidator.extract_and_validate_citations(
                raw_text, retrieved_chunks
            )
            yield {"type": "done", "citations": citations}


# ------------------------------------------------------------------------------
# BLOCK 5: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing Grounded Generator ---")
    gen = GroundedGenerator()
    test_chunks = [
        {
            "source_file": "valve_spec.pdf",
            "page_numbers": [14],
            "text": "Table 4: Valve V-200-B maximum pressure is 5200 PSI at 180°C."
        }
    ]
    res = gen.generate_answer("What is the maximum pressure for Valve V-200-B?", test_chunks)
    print("Answer:")
    print(res["answer"])
    print("\nVerified Citations:")
    print(res["citations"])
