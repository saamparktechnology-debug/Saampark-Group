@echo off
cd /d "%~dp0backend\src_extracted"
title CRM Backend - port 5000
echo ============================================================
echo   CRM BACKEND  -  http://localhost:5000/api/health
echo   Keep this window open. Press Ctrl+C to stop.
echo ============================================================
echo.
if not exist "node_modules" (
  echo node_modules missing - running npm install ...
  call npm install
)
call npm start
echo.
echo [Backend stopped.]
pause
