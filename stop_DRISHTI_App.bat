@echo off
title Stop DRISHTI Servers
echo Stopping DRISHTI Backend (Port 8008) and Frontend (Port 5173)...
taskkill /FI "WINDOWTITLE eq DRISHTI Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq DRISHTI Frontend*" /F >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8008" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Done! DRISHTI servers on ports 8008 and 5173 stopped.

