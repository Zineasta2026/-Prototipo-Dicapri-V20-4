@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo No se encontro .venv. Ejecuta primero instalar.bat.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" -m uvicorn --app-dir "backend" api:app --host 0.0.0.0 --port 8000

