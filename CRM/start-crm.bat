@echo off
cd /d "%~dp0"
title Saampark CRM - Launcher

echo ============================================================
echo    SAAMPARK CRM  -  Local Launcher
echo ============================================================
echo.
echo  Make sure MySQL is STARTED in the XAMPP Control Panel.
echo  (Apache is NOT required - this is a Node.js app, not PHP.)
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in your PATH.
  echo         Install Node 20+ from https://nodejs.org then re-run this file.
  echo.
  pause
  exit /b 1
)

echo [1/3] Preparing database "crm_db" ...
echo ------------------------------------------------------------
pushd "%~dp0backend\src_extracted"
call node ensure_db.js
if errorlevel 1 (
  echo.
  echo [FAILED] Database preparation failed - read the message above.
  popd
  pause
  exit /b 1
)

echo.
echo [2/3] Applying migrations and seeding admin accounts ...
echo ------------------------------------------------------------
call node migrate.js
if errorlevel 1 (
  echo.
  echo [FAILED] Migration failed - read the message above.
  popd
  pause
  exit /b 1
)
popd

echo.
echo [3/3] Starting the backend and frontend servers ...
echo ------------------------------------------------------------
start "CRM Backend (port 5000)"  "%~dp0_run-backend.bat"
timeout /t 3 /nobreak >nul
start "CRM Frontend (port 3000)" "%~dp0_run-frontend.bat"

echo.
echo ============================================================
echo  Two new windows have opened (backend + frontend).
echo.
echo  Next.js needs ~15-30 seconds to compile the first time.
echo  Wait until the frontend window prints "Ready", then open:
echo.
echo        http://localhost:3000
echo.
echo  Login e-mail : hiisupriya@gmail.com
echo  Password     : 123456
echo.
echo  Closing those two windows stops the servers.
echo ============================================================
echo.
pause
