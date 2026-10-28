@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  py -m http.server 8080 --bind 127.0.0.1
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    start "" http://localhost:8080
    python -m http.server 8080 --bind 127.0.0.1
  ) else (
    echo Python 3 is required. Install Python, then run this file again.
    pause
  )
)
