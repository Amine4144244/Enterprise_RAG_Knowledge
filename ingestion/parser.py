# ==============================================================================
# DOCUMENT PARSER MODULE (Using IBM Docling)
# This file takes a PDF file from your computer and extracts all text,
# headings, layout elements, and complex tables using IBM Docling.
# ==============================================================================

import os
from pathlib import Path
from typing import Optional

# ------------------------------------------------------------------------------
# BLOCK 1: Safe Import of Docling
# Docling is a powerful library, but if someone runs the project before running
# 'pip install -r requirements.txt', we want to give them a friendly message.
# ------------------------------------------------------------------------------
try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling_core.types.doc import DoclingDocument
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False
    DoclingDocument = None


class PDFParser:
    """
    This class handles loading and parsing PDF files using Docling.
    It configures the extraction options to make sure tables are parsed accurately.
    """

    def __init__(self):
        # ----------------------------------------------------------------------
        # BLOCK 2: Configure Docling Pipeline Options
        # We tell Docling what features to enable during PDF extraction.
        # Specifically, we want deep table structure recognition turned on.
        # ----------------------------------------------------------------------
        if not DOCLING_AVAILABLE:
            print("[PDFParser] WARNING: 'docling' is not installed in your Python environment.")
            print("            Please install it using: pip install docling docling-core")
            self.converter = None
            return

        print("[PDFParser] Initializing Docling DocumentConverter...")
        
        # Create pipeline options for PDF processing
        pipeline_options = PdfPipelineOptions()
        
        # Turn on table structure recognition (critical for technical spec sheets)
        pipeline_options.do_table_structure = True
        
        # Enable OCR (Optical Character Recognition) if needed for scanned documents
        pipeline_options.do_ocr = True

        # Now create the main Docling converter with our custom options
        self.converter = DocumentConverter(
            format_options={
                PdfFormatOption: pipeline_options
            }
        )
        print("[PDFParser] Docling is ready to parse documents!")

    def parse_pdf(self, file_path: str):
        """
        BLOCK 3: Parse a PDF file
        Takes the path to a PDF file on disk, runs Docling extraction,
        and returns the structured DoclingDocument object.
        """
        # Step 1: Check if the file actually exists
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"[PDFParser] Error: PDF file not found at: {file_path}")

        print(f"[PDFParser] Starting parsing for: {path.name}...")

        # Step 2: Check if Docling is installed
        if not DOCLING_AVAILABLE or self.converter is None:
            raise RuntimeError(
                "[PDFParser] Cannot parse PDF because Docling is not installed. "
                "Run: pip install docling docling-core"
            )

        # Step 3: Run the conversion (this extracts text, tables, and layouts)
        conversion_result = self.converter.convert(file_path)

        # Step 4: Extract the core DoclingDocument from the conversion result
        docling_document = conversion_result.document
        print(f"[PDFParser] Successfully parsed '{path.name}'!")

        return docling_document

    def export_to_markdown(self, docling_document) -> str:
        """
        BLOCK 4: Export to Clean Markdown
        Docling can convert the entire parsed document into a clean Markdown string.
        Tables are automatically formatted as clean Markdown tables!
        """
        if docling_document is None:
            return ""
        
        # Docling provides a built-in method to export the entire document as markdown
        return docling_document.export_to_markdown()


# ------------------------------------------------------------------------------
# BLOCK 5: Quick Manual Test
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Testing PDFParser Module ---")
    parser = PDFParser()
    if DOCLING_AVAILABLE:
        print("Docling is installed and ready to be used.")
    else:
        print("Docling is not installed yet. Follow requirements.txt to install.")
