@echo off
title DRISHTI Early Risk Detection System Launcher
echo ========================================================
echo        DRISHTI - Early Risk Detection System
echo ========================================================
echo.
echo Starting FastAPI Backend Server on port 8008...
start "DRISHTI Backend (FastAPI)" /min cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8008 --reload"

timeout /t 3 /nobreak >nul

echo Starting React Frontend Server on port 5173...
start "DRISHTI Frontend (React)" /min cmd /c "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 2 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo.
echo ========================================================
echo DRISHTI is running! Keep this window open or minimize it.
echo Close this window or run stop_DRISHTI_App.bat to stop.
echo ========================================================
