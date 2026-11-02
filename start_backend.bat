@echo off
title Enterprise RAG - FastAPI Backend
echo ===================================================
echo Starting FastAPI Backend Server on http://127.0.0.1:8001
echo ===================================================
cd /d "%~dp0"

REM Activate virtual environment if it exists
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM Start uvicorn on port 8001 using the virtualenv python
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn api.app:app --host 127.0.0.1 --port 8001 --reload
) else (
    python -m uvicorn api.app:app --host 127.0.0.1 --port 8001 --reload
)
pause
