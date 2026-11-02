@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo No se encontro node_modules. Ejecuta primero instalar.bat.
  pause
  exit /b 1
)

call npm run dev -- --host 0.0.0.0

