$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonExe = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "No se encontró .venv. Créalo e instala backend\requirements.txt." -ForegroundColor Yellow
    exit 1
}

& $PythonExe -m uvicorn --app-dir (Join-Path $ProjectRoot "backend") api:app --host 0.0.0.0 --port 8000

