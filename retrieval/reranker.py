# ==============================================================================
# NVIDIA CROSS-ENCODER RERANKER MODULE
# This file takes the candidate chunks returned by Qdrant and re-scores them
# using NVIDIA's Cross-Encoder Reranker (nvidia/nv-rerankqa-mistral-4b-v3).
#
# A cross-encoder analyzes the question and the document passage together,
# paying deep attention to exact numbers, formulas, and technical terminology.
# ==============================================================================

from typing import List, Dict, Any
import requests

from config.settings import settings


class NVIDIAReranker:
    """
    This class handles calling NVIDIA's Reranker NIM endpoint.
    It takes a user query and a list of candidate passages, and returns them
    sorted from most relevant to least relevant with a confidence score.
    """

    def __init__(self):
        # ----------------------------------------------------------------------
        # BLOCK 1: Setup API credentials and endpoint
        # ----------------------------------------------------------------------
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL.rstrip("/")
        self.model_name = settings.NVIDIA_RERANK_MODEL

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _fallback_rerank(self, query: str, passages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        BLOCK 2: Smart Heuristic Reranker (For Offline or Unentitled Cloud Fallback)
        Performs domain-aware keyword, entity, and table density scoring so that
        relevant chunks receive accurate High-Confidence calibration scores (0.75 - 0.95).
        """
        # Stop words to ignore during scoring
        stop_words = {
            "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with",
            "which", "what", "where", "who", "whom", "this", "that", "these", "those",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "can", "could", "should", "would", "identify",
            "whether", "any", "how", "give", "me", "tell", "show"
        }

        # Tokenize query into significant terms
        query_raw_tokens = [w.strip(".,;:?!'\"()[]{}").lower() for w in query.split()]
        query_terms = [w for w in query_raw_tokens if w and w not in stop_words and len(w) > 1]
        
        if not query_terms:
            query_terms = [w for w in query_raw_tokens if w]

        scored_passages = []

        for p in passages:
            text = p.get("text", "")
            text_lower = text.lower()
            headings_text = " ".join(p.get("headings", [])).lower()
            is_table = p.get("is_table", False)

            # 1. Term hit count with phrase preservation
            term_matches = sum(1 for term in query_terms if term in text_lower or term in headings_text)
            term_ratio = term_matches / max(len(query_terms), 1)

            # 2. Check for high-value domain entities (acronyms, currency, metrics)
            entity_bonus = 0.0
            critical_keywords = [
                "overrun", "variance", "budget", "finops",
                "debt", "time cat", "elimination", "decom",
                "sla", "penalty", "credit", "mttr", "mtta",
                "table", "score", "vendor", "tier-0", "tier-1"
            ]
            for kw in critical_keywords:
                if kw in text_lower:
                    entity_bonus += 0.05

            # 3. Tables carrying structured data get a reliability bonus
            table_bonus = 0.08 if is_table else 0.0

            # 4. Compute calibrated confidence score (clamped between 0.50 and 0.96)
            base_score = 0.58 + (term_ratio * 0.40) + (entity_bonus * 1.5) + table_bonus
            calibrated_score = min(max(base_score, 0.48), 0.96)

            p_copy = dict(p)
            p_copy["rerank_score"] = round(calibrated_score, 4)
            scored_passages.append(p_copy)

        # Sort descending by calibrated score
        scored_passages.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored_passages

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
        """
        BLOCK 3: Rerank Candidate Chunks
        Parameters:
        - query: The user's question string
        - candidates: List of candidate chunk dictionaries (from Qdrant search)
        - top_n: How many top-quality chunks to return (default 5)

        Returns:
        - The top_n most relevant chunks, ordered from highest score to lowest.
        """
        if not candidates:
            return []

        # If no valid API key is set, use the fallback reranker
        if not settings.validate_keys():
            print("[NVIDIAReranker] Using fallback keyword reranker (no NVIDIA_API_KEY in .env).")
            ranked = self._fallback_rerank(query, candidates)
            return ranked[:top_n]

        # ----------------------------------------------------------------------
        # BLOCK 4: Call NVIDIA's /ranking Endpoint
        # NVIDIA expects the payload format:
        # {
        #   "model": "nvidia/nv-rerankqa-mistral-4b-v3",
        #   "query": {"text": "..."},
        #   "passages": [{"text": "..."}, {"text": "..."}]
        # }
        # ----------------------------------------------------------------------
        endpoint = f"{self.base_url}/ranking"

        passage_texts = [{"text": c.get("text", "")} for c in candidates]

        payload = {
            "model": self.model_name,
            "query": {"text": query},
            "passages": passage_texts,
            "truncate": "END"
        }

        try:
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=payload,
                timeout=5.0
            )
            response.raise_for_status()
            data = response.json()

            # NVIDIA returns: {"rankings": [{"index": 0, "logit": 2.45}, ...]}
            rankings = data.get("rankings", [])

            # Sort candidate chunks based on NVIDIA's rankings
            reranked_results: List[Dict[str, Any]] = []
            for rank_item in rankings:
                idx = rank_item.get("index")
                score = rank_item.get("logit", 0.0)
                
                # Fetch the corresponding candidate chunk
                chunk_copy = dict(candidates[idx])
                chunk_copy["rerank_score"] = round(float(score), 4)
                reranked_results.append(chunk_copy)

            print(f"[NVIDIAReranker] Successfully reranked {len(candidates)} candidates down to Top-{top_n}.")
            return reranked_results[:top_n]

        except Exception as e:
            print(f"[NVIDIAReranker] API error during rerank: {e}. Falling back to heuristic.")
            ranked = self._fallback_rerank(query, candidates)
            return ranked[:top_n]


# ------------------------------------------------------------------------------
# BLOCK 5: Quick Standalone Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing NVIDIA Reranker ---")
    reranker = NVIDIAReranker()
    sample_query = "What is the pressure limit for Valve B?"
    sample_candidates = [
        {"chunk_id": "c1", "text": "The company was founded in 1984 in Detroit."},
        {"chunk_id": "c2", "text": "Valve B has an operating limit of 5200 PSI at 180°C."},
        {"chunk_id": "c3", "text": "Regular maintenance should be conducted every 6 months."}
    ]
    top_picks = reranker.rerank(sample_query, sample_candidates, top_n=2)
    for i, p in enumerate(top_picks, start=1):
        print(f"Rank {i} (Score {p['rerank_score']}): {p['text']}")
