@echo off
title Pathfinding Agent - Launcher

echo.
echo  =========================================
echo   Pathfinding Agent - Starting Up...
echo  =========================================
echo.

:: Start Backend in a new window
echo  [1/2] Starting Backend (FastAPI)...
if exist "%~dp0backend\venv\Scripts\python.exe" (
    echo  Virtual environment found, using it...
    start "Pathfinding - Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
) else (
    echo  No virtual environment found, using system Python...
    start "Pathfinding - Backend" cmd /k "cd /d %~dp0backend && py -m uvicorn main:app --reload --port 8000"
)

:: Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak > nul

:: Install frontend dependencies if node_modules doesn't exist
echo  [2/3] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo  node_modules not found - running npm install first...
    cd /d %~dp0frontend
    npm install
    echo  npm install complete!
) else (
    echo  Dependencies already installed, skipping npm install.
)

:: Start Frontend in a new window
echo  [3/3] Starting Frontend (React + Vite)...
start "Pathfinding - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait 3 seconds for frontend to spin up
timeout /t 3 /nobreak > nul

:: Open browser
echo.
echo  Opening browser...
start http://localhost:5173

echo.
echo  =========================================
echo   Both servers are running!
echo   
echo   Backend  -> http://localhost:8000
echo   Frontend -> http://localhost:5173
echo   
echo   Close the two other terminal windows
echo   to shut everything down.
echo  =========================================
echo.
pause
