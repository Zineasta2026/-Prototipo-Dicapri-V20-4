@echo off
setlocal
cd /d "%~dp0"

py -3.11 -m venv .venv
if errorlevel 1 goto :error

".venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 goto :error

call npm install
if errorlevel 1 goto :error

echo.
echo Instalacion completada correctamente.
pause
exit /b 0

:error
echo.
echo La instalacion no pudo completarse. Revisa el mensaje anterior.
pause
exit /b 1

