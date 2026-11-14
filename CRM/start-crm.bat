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

echo [1/3] Preparing backend and database "crm_db" ...
echo ------------------------------------------------------------
pushd "%~dp0backend\src_extracted"

if not exist ".env" (
  echo [INFO] Generating default backend .env ...
  (
    echo PORT=5000
    echo NODE_ENV=development
    echo.
    echo DB_HOST=localhost
    echo DB_PORT=3306
    echo DB_USER=root
    echo DB_PASSWORD=
    echo DB_NAME=crm_db
    echo.
    echo JWT_SECRET=8vK#2mQ!7xP@4zL$9rT^6nW&3cY*5sH@1jF!8dQ#0kV$6pX
    echo JWT_EXPIRES_IN=1d
    echo.
    echo CLIENT_URL=http://localhost:3000
  ) > .env
)

if not exist "node_modules" (
  echo [INFO] Backend node_modules not found. Installing packages (first-time setup) ...
  call npm install
  if errorlevel 1 (
    echo [FAILED] Backend npm install failed.
    popd
    pause
    exit /b 1
  )
)

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
