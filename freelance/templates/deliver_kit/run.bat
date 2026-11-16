@echo off
rem ====================================================================
rem  Delivery launcher template (Windows).  ASCII only on purpose.
rem  NOT TESTED ON WINDOWS yet - test on a clean PC before delivering.
rem  Edit the two lines marked [EDIT] for each project.
rem ====================================================================
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set SCRIPT=01_web_scraper.py
set ARGS=--pages 3 --delay 1.0 --out result.xlsx
rem  ^ [EDIT] script name and arguments for this delivery

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found.
  echo         Install Python 3 from python.org and check "Add Python to PATH", then run again.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\activate.bat" (
  echo Creating virtual environment ^(first run only^)...
  python -m venv .venv
  if errorlevel 1 (
    echo [ERROR] Could not create the virtual environment.
    pause
    exit /b 1
  )
  call ".venv\Scripts\activate.bat"
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] Package installation failed. Check the network and try again.
    pause
    exit /b 1
  )
) else (
  call ".venv\Scripts\activate.bat"
)

python %SCRIPT% %ARGS%
set RC=%errorlevel%

echo.
if "%RC%"=="0" (
  echo Finished successfully.
) else (
  echo Finished with exit code %RC%. Read the messages above and see README for troubleshooting.
)
pause
exit /b %RC%
