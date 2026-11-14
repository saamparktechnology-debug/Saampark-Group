@echo off
cd /d "%~dp0frontend"
title CRM Frontend - port 3000
echo ============================================================
echo   CRM FRONTEND  -  http://localhost:3000
echo   Keep this window open. Press Ctrl+C to stop.
echo ============================================================
echo.
if not exist ".env.local" (
  echo [INFO] Generating default frontend .env.local ...
  echo NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api/v1> .env.local
)
if not exist "node_modules" (
  echo node_modules missing - running npm install ...
  call npm install
)
call npm run dev
echo.
echo [Frontend stopped.]
pause
