@echo off
REM ── ValTracker Build Script (Windows) ──
echo [1/3] Installing frontend dependencies...
cd frontend && npm install
if %errorlevel% neq 0 exit /b 1

echo [2/3] Building Astro frontend...
npm run build
if %errorlevel% neq 0 exit /b 1

echo [3/3] Build complete!
echo.
echo Frontend:  cd frontend ^&^& node dist/server/entry.mjs
echo API:       gunicorn -c gunicorn.conf.py api:app
echo.
echo Or use: docker-compose up
