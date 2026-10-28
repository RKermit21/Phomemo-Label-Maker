@echo off
setlocal
cd /d "%~dp0"

REM Use the installed Python 3.13 package executable, then fall back to PATH.
set "PYTHON_EXE=%LOCALAPPDATA%\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

REM Verify that Python can run the built-in web server.
"%PYTHON_EXE%" -c "import http.server" >nul 2>nul
if errorlevel 1 (
  echo Could not run Python's built-in web server.
  echo Detected path: %PYTHON_EXE%
  echo Try opening Command Prompt and running: python -m http.server 8080
  pause
  exit /b 1
)

REM Start the server directly in a separate console window.
start "Strip Studio Local Server" /D "%~dp0" "%PYTHON_EXE%" -m http.server 8080 --bind 127.0.0.1
if errorlevel 1 (
  echo Could not start the local server.
  pause
  exit /b 1
)

timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/index.html"
endlocal
