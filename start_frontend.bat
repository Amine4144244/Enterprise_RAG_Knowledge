@echo off
title Enterprise RAG - Vite Frontend
echo ===================================================
echo Starting Vite + React Frontend on http://localhost:5173
echo ===================================================
cd /d "%~dp0frontend"
npm run dev
pause
