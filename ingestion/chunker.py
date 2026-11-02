# ==============================================================================
# HYBRID CHUNKER MODULE (Using Docling's HybridChunker)
# This file takes the parsed DoclingDocument and splits it into smart,
# structured chunks while preserving tables, heading hierarchies, and page numbers.
# ==============================================================================

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

# ------------------------------------------------------------------------------
# BLOCK 1: Safe Import of Docling Chunker
# We import HybridChunker from docling.chunking.
# HybridChunker is special because it respects document boundaries (sections,
# paragraphs, and tables) rather than blindly cutting text after N characters.
# ------------------------------------------------------------------------------
try:
    from docling.chunking import HybridChunker
    from docling_core.types.doc import TableItem
    CHUNKER_AVAILABLE = True
except ImportError:
    CHUNKER_AVAILABLE = False
    TableItem = None


# ------------------------------------------------------------------------------
# BLOCK 2: Data Model for a Structured Chunk
# We define a clear Python dataclass so every chunk in our system has a
# consistent, predictable format.
# ------------------------------------------------------------------------------
@dataclass
class StructuredChunk:
    """
    Represents a single chunk of text ready for embedding and indexing.
    """
    chunk_id: str                      # Unique ID (e.g. "manual.pdf_chunk_001")
    text: str                          # The actual content of the chunk (text or markdown table)
    context_enriched_text: str         # Text prefixed with document name and section headers
    source_file: str                   # Name of the original PDF file
    page_numbers: List[int]            # List of page numbers this chunk belongs to (e.g. [3, 4])
    section_headings: List[str]        # Breadcrumb trail of headings (e.g. ["Section 1", "Specs"])
    is_table: bool                     # True if this chunk contains a table, False if normal text

    def to_dict(self) -> Dict[str, Any]:
        """Convert the chunk object into a standard Python dictionary."""
        return asdict(self)


class DocumentChunker:
    """
    This class wraps Docling's HybridChunker and enriches each chunk with
    provenance metadata (page numbers, section paths, table flags).
    """

    def __init__(self, max_tokens: int = 512):
        # ----------------------------------------------------------------------
        # BLOCK 3: Initialize the HybridChunker
        # max_tokens: maximum token length for any single chunk.
        # 512 is the sweet spot for NVIDIA embedding models and retrieval accuracy.
        # ----------------------------------------------------------------------
        self.max_tokens = max_tokens

        if CHUNKER_AVAILABLE:
            print(f"[DocumentChunker] Initializing HybridChunker (max_tokens={max_tokens})...")
            # HybridChunker automatically merges small paragraphs under the same heading
            # and prevents splitting tables right down the middle when possible.
            self.chunker = HybridChunker(max_tokens=self.max_tokens)
        else:
            print("[DocumentChunker] WARNING: 'docling.chunking' not available.")
            self.chunker = None

    def chunk_document(self, docling_document, source_filename: str) -> List[StructuredChunk]:
        """
        BLOCK 4: Process DoclingDocument into Structured Chunks
        Takes a DoclingDocument object and returns a list of StructuredChunk objects.
        """
        if not CHUNKER_AVAILABLE or self.chunker is None:
            raise RuntimeError(
                "[DocumentChunker] Cannot chunk document because Docling is not installed. "
                "Run: pip install docling docling-core"
            )

        print(f"[DocumentChunker] Chunking '{source_filename}' using HybridChunker...")
        structured_chunks: List[StructuredChunk] = []

        # Step 1: Run Docling's chunker on the document
        raw_chunks = list(self.chunker.chunk(docling_document))
        print(f"[DocumentChunker] Generated {len(raw_chunks)} raw chunks from Docling.")

        # Step 2: Loop through each raw chunk and extract its metadata
        for index, raw_chunk in enumerate(raw_chunks):
            # Generate a clean, unique ID for this chunk
            chunk_id = f"{source_filename}_chunk_{index:04d}"
            
            # The plain text of the chunk
            chunk_text = raw_chunk.text

            # ------------------------------------------------------------------
            # Extract Section Headings (Breadcrumbs)
            # Docling stores the parent headings in raw_chunk.meta.headings
            # For example: ["Chapter 2", "2.1 Technical Specs"]
            # ------------------------------------------------------------------
            headings: List[str] = []
            if hasattr(raw_chunk, "meta") and hasattr(raw_chunk.meta, "headings"):
                headings = [h.strip() for h in raw_chunk.meta.headings if h.strip()]

            # ------------------------------------------------------------------
            # Extract Page Numbers from Document Items
            # Each chunk is made of one or more "doc_items". Each item has
            # provenance records that tell us exactly which page it came from.
            # ------------------------------------------------------------------
            page_numbers_set = set()
            contains_table = False

            if hasattr(raw_chunk, "meta") and hasattr(raw_chunk.meta, "doc_items"):
                for item in raw_chunk.meta.doc_items:
                    # Check if this item is a table
                    if TableItem is not None and isinstance(item, TableItem):
                        contains_table = True

                    # Extract page numbers
                    if hasattr(item, "prov") and item.prov:
                        for p in item.prov:
                            if hasattr(p, "page_no"):
                                page_numbers_set.add(p.page_no)

            # Sort page numbers in ascending order (e.g. [1, 2])
            sorted_pages = sorted(list(page_numbers_set)) if page_numbers_set else [1]

            # ------------------------------------------------------------------
            # Create the Context-Enriched Text
            # We prefix the chunk text with document name and section path.
            # This ensures that when the embedding model reads the chunk, it knows
            # the exact context (e.g. "Document: manual.pdf > Specs > Voltage: 24V")
            # ------------------------------------------------------------------
            heading_prefix = " > ".join(headings) if headings else "General"
            enriched_text = (
                f"Document: {source_filename} | Section: {heading_prefix}\n"
                f"{chunk_text}"
            )

            # Build our StructuredChunk object
            structured_chunk = StructuredChunk(
                chunk_id=chunk_id,
                text=chunk_text,
                context_enriched_text=enriched_text,
                source_file=source_filename,
                page_numbers=sorted_pages,
                section_headings=headings,
                is_table=contains_table
            )

            structured_chunks.append(structured_chunk)

        print(f"[DocumentChunker] Successfully created {len(structured_chunks)} structured chunks.")
        return structured_chunks


# ------------------------------------------------------------------------------
# BLOCK 5: Quick Manual Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing DocumentChunker Module ---")
    chunker = DocumentChunker(max_tokens=512)
    print("DocumentChunker module initialized successfully.")
