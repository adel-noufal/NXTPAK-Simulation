@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD="
python --version >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=python"
if not defined PYTHON_CMD (
  py -3 --version >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
  echo Python 3 was not found. Install Python from https://www.python.org/downloads/ and try again.
  pause
  exit /b 1
)

start "" http://127.0.0.1:8080/
%PYTHON_CMD% -m http.server 8080 --bind 127.0.0.1

if errorlevel 1 (
  echo.
  echo The local server could not start. Port 8080 may already be in use.
  pause
)

endlocal
