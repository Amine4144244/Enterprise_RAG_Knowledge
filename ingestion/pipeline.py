# ==============================================================================
# INGESTION PIPELINE ORCHESTRATOR
# This file ties the PDF Parser and the Hybrid Chunker together into one pipeline.
# It also caches the parsed chunks to disk (in a JSON file) so you don't have
# to re-parse the same PDF over and over while testing!
# ==============================================================================

import os
import json
from pathlib import Path
from typing import List

# Import our custom parser and chunker modules
from ingestion.parser import PDFParser
from ingestion.chunker import DocumentChunker, StructuredChunk


class IngestionPipeline:
    """
    Orchestrates the entire ingestion process for a PDF:
    PDF File on Disk -> Docling Extraction -> Hybrid Chunking -> Cached JSON -> Structured Chunks
    """

    def __init__(self, cache_dir: str = "./storage/cache"):
        # ----------------------------------------------------------------------
        # BLOCK 1: Set up the Cache Directory
        # Parsing PDFs takes time. We create a local cache folder to store
        # the processed chunks in JSON format for quick reloading.
        # ----------------------------------------------------------------------
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Initialize the parser and chunker
        self.parser = PDFParser()
        self.chunker = DocumentChunker(max_tokens=512)

    def process_pdf(self, pdf_file_path: str, use_cache: bool = True) -> List[StructuredChunk]:
        """
        BLOCK 2: Main Processing Function
        Takes a PDF file path and returns a list of StructuredChunk objects.
        If a cache file already exists, it loads directly from cache.
        """
        pdf_path = Path(pdf_file_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"[Pipeline] PDF not found: {pdf_file_path}")

        filename = pdf_path.name
        # The cache filename will be like: "storage/cache/my_file.pdf.chunks.json"
        cache_file = self.cache_dir / f"{filename}.chunks.json"

        # ----------------------------------------------------------------------
        # BLOCK 3: Check if Cached Chunks Already Exist
        # If cache exists and use_cache is True, we load from disk instantly!
        # ----------------------------------------------------------------------
        if use_cache and cache_file.exists():
            print(f"[Pipeline] Loading cached chunks from: {cache_file.name}")
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Reconstruct StructuredChunk objects from the stored dictionaries
                chunks = [StructuredChunk(**item) for item in data]
                print(f"[Pipeline] Loaded {len(chunks)} chunks instantly from cache!")
                return chunks

        # ----------------------------------------------------------------------
        # BLOCK 4: Step 1 - Parse the PDF with Docling
        # Extracts layout, text, headings, and tables.
        # ----------------------------------------------------------------------
        print(f"[Pipeline] Step 1/3: Parsing PDF with Docling: {filename}...")
        docling_doc = self.parser.parse_pdf(str(pdf_path))

        # ----------------------------------------------------------------------
        # BLOCK 5: Step 2 - Chunk the Document using HybridChunker
        # Breaks document into atomic chunks while respecting table boundaries.
        # ----------------------------------------------------------------------
        print(f"[Pipeline] Step 2/3: Chunking document with HybridChunker...")
        chunks = self.chunker.chunk_document(docling_doc, source_filename=filename)

        # ----------------------------------------------------------------------
        # BLOCK 6: Step 3 - Save the Chunks to Cache
        # We save the chunks as JSON so subsequent runs are instant.
        # ----------------------------------------------------------------------
        print(f"[Pipeline] Step 3/3: Saving chunks to cache: {cache_file.name}...")
        chunks_data = [chunk.to_dict() for chunk in chunks]
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(chunks_data, f, indent=2, ensure_ascii=False)

        print(f"[Pipeline] Done! Successfully processed '{filename}' into {len(chunks)} chunks.")
        return chunks


# ------------------------------------------------------------------------------
# BLOCK 7: Standalone manual test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Ingestion Pipeline Ready ---")
    pipeline = IngestionPipeline()
    print("Ingestion pipeline is initialized and ready to process PDFs.")
