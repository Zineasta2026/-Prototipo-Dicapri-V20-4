from __future__ import annotations

import csv
import json
import os
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/validation", tags=["validacion-experimental"])

VALIDATION_DIR = Path(__file__).resolve().parent
BACKEND_DIR = VALIDATION_DIR.parent
RUNS_ROOT = BACKEND_DIR / "data" / "validation_runs"
V4_SCRIPT = VALIDATION_DIR / "v4_escenarios_dicapri.py"
V5_SCRIPT = VALIDATION_DIR / "v5_ejecucion_dicapri.py"
SENSITIVITY_SCRIPT = VALIDATION_DIR / "v5_sensibilidad_supuestos.py"

_DEFAULT_BASE = BACKEND_DIR / "data" / "BASE_DE_DATOS_DICAPRI_2025_HIBRIDA_v3.5.xlsx"
BASE_XLSX = Path(
    os.environ.get("DICAPRI_VALIDATION_BASE_XLSX")
    or os.environ.get("BASE_XLSX")
    or _DEFAULT_BASE
).expanduser()

JOBS: dict[str, dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()
RUN_LOCK = threading.Lock()
MAX_RUNTIME_SECONDS = 5400

V4_FILES = {
    "anclas.csv",
    "ficha_escenarios.csv",
    "semillas.csv",
    "bondad_ajuste.csv",
    "carvalho_reproduccion.csv",
    "carvalho_falsas_alarmas.csv",
    "equivalencia/casos_equivalencia.csv",
    "equivalencia/secuencias_esperadas.csv",
    "equivalencia/reglas_y_codigo.csv",
    "flujos_eventos.npz",
    "version.json",
}
V5_FILES = {
    "resultados_brutos_v5.csv",
    "orden_ejecucion.csv",
    "resumen_v5.csv",
    "recall_equilibrio.csv",
    "version_v5.json",
    "sensibilidad_supuestos_bruto.csv",
    "sensibilidad_supuestos.csv",
}
ALLOWED_FILES = V4_FILES | V5_FILES | {"v4.log", "v5.log", "sensibilidad.log"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_dir(job_id: str) -> Path:
    if not job_id.isalnum():
        raise HTTPException(status_code=404, detail="Ejecución no encontrada.")
    path = (RUNS_ROOT / job_id).resolve()
    try:
        path.relative_to(RUNS_ROOT.resolve())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ejecución no encontrada.") from exc
    return path


def _save_job(job_id: str, **updates: Any) -> dict[str, Any]:
    with JOBS_LOCK:
        state = JOBS.setdefault(job_id, {"job_id": job_id, "created_at": _now()})
        state.update(updates)
        state["updated_at"] = _now()
        folder = _job_dir(job_id)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "job.json").write_text(
            json.dumps(state, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return dict(state)


def _load_job(job_id: str) -> dict[str, Any]:
    with JOBS_LOCK:
        cached = JOBS.get(job_id)
        if cached:
            return dict(cached)
    state_file = _job_dir(job_id) / "job.json"
    if not state_file.is_file():
        raise HTTPException(status_code=404, detail="Ejecución no encontrada.")
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="No se pudo leer el estado de la ejecución.") from exc
    with JOBS_LOCK:
        JOBS[job_id] = state
    return dict(state)


def _check_ready() -> None:
    missing = [str(p) for p in (V4_SCRIPT, V5_SCRIPT, SENSITIVITY_SCRIPT) if not p.is_file()]
    if missing:
        raise HTTPException(
            status_code=500,
            detail={"message": "Faltan scripts de validación.", "missing": missing},
        )
    if not BASE_XLSX.is_file():
        raise HTTPException(
            status_code=409,
            detail={
                "message": "No se encontró la base híbrida requerida por V4.",
                "required_file": "BASE_DE_DATOS_DICAPRI_2025_HIBRIDA_v3.5.xlsx",
                "expected_default": str(_DEFAULT_BASE),
                "configuration": "Copia el archivo de forma local en backend/data o define DICAPRI_VALIDATION_BASE_XLSX con su ruta absoluta. No lo subas a GitHub.",
            },
        )


def _run_script(script: Path, env: dict[str, str], cwd: Path, log_path: Path) -> None:
    with log_path.open("w", encoding="utf-8") as log:
        log.write(f"Script: {script.name}\nInicio: {_now()}\n\n")
        log.flush()
        try:
            completed = subprocess.run(
                [sys.executable, str(script)],
                cwd=str(cwd),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=MAX_RUNTIME_SECONDS,
                check=False,
            )
            log.write(completed.stdout or "")
            log.flush()
            if completed.returncode != 0:
                raise RuntimeError(
                    f"{script.name} terminó con código {completed.returncode}. "
                    f"Revisa {log_path.name}."
                )
        except subprocess.TimeoutExpired as exc:
            output = exc.stdout or ""
            if isinstance(output, bytes):
                output = output.decode("utf-8", errors="replace")
            log.write(str(output))
            log.write(f"\nTiempo máximo excedido: {MAX_RUNTIME_SECONDS} segundos.\n")
            raise RuntimeError(f"{script.name} excedió el tiempo máximo permitido.") from exc


def _base_env(v4_out: Path, v5_out: Path) -> dict[str, str]:
    env = os.environ.copy()
    env["BASE_XLSX"] = str(BASE_XLSX)
    env["V4_SCRIPT"] = str(V4_SCRIPT)
    env["V4_SALIDA"] = str(v4_out)
    env["OUT_DIR"] = str(v4_out)
    env["PYTHONUNBUFFERED"] = "1"
    return env


def _execute_v4(job_id: str) -> None:
    folder = _job_dir(job_id)
    v4_out = folder / "salida_v4"
    v5_out = folder / "salida_v5"
    v4_out.mkdir(parents=True, exist_ok=True)
    v5_out.mkdir(parents=True, exist_ok=True)
    _save_job(job_id, status="running", stage="V4 · generación de escenarios", progress=10)
    env = _base_env(v4_out, v5_out)
    _run_script(V4_SCRIPT, env, BACKEND_DIR, folder / "v4.log")
    _save_job(
        job_id,
        status="completed",
        stage="V4 completado",
        progress=100,
        output_dir=str(v4_out),
        files=sorted(str(p.relative_to(folder)) for p in v4_out.rglob("*") if p.is_file()),
    )


def _execute_v5(job_id: str) -> None:
    folder = _job_dir(job_id)
    v4_out = folder / "salida_v4"
    v5_out = folder / "salida_v5"
    v4_out.mkdir(parents=True, exist_ok=True)
    v5_out.mkdir(parents=True, exist_ok=True)
    _save_job(job_id, status="running", stage="V4 · preparación de flujos", progress=5)
    env = _base_env(v4_out, v5_out)
    try:
        _run_script(V4_SCRIPT, env, BACKEND_DIR, folder / "v4.log")
        _save_job(job_id, stage="V5 · barrido TPR/FPR", progress=35)
        env["OUT_DIR"] = str(v5_out)
        _run_script(V5_SCRIPT, env, BACKEND_DIR, folder / "v5.log")
        _save_job(job_id, stage="V5 · sensibilidad de supuestos", progress=85)
        _run_script(SENSITIVITY_SCRIPT, env, BACKEND_DIR, folder / "sensibilidad.log")
        files = sorted(str(p.relative_to(folder)) for p in folder.rglob("*") if p.is_file())
        _save_job(
            job_id,
            status="completed",
            stage="Validación V4/V5 completada",
            progress=100,
            output_dir=str(v5_out),
            files=files,
            note="Resultados sintéticos exploratorios. TPR/FPR son parámetros barridos, no métricas medidas de YOLO.",
        )
    except Exception as exc:
        _save_job(job_id, status="failed", stage="Error de ejecución", error=str(exc))
        raise


def _background_v4(job_id: str) -> None:
    with RUN_LOCK:
        try:
            _execute_v4(job_id)
        except Exception as exc:
            _save_job(job_id, status="failed", stage="Error de ejecución", error=str(exc))


def _background_v5(job_id: str) -> None:
    with RUN_LOCK:
        try:
            _execute_v5(job_id)
        except Exception as exc:
            _save_job(job_id, status="failed", stage="Error de ejecución", error=str(exc))


@router.get("/config")
def validation_config():
    return {
        "ready": BASE_XLSX.is_file() and V4_SCRIPT.is_file() and V5_SCRIPT.is_file(),
        "base_file_found": BASE_XLSX.is_file(),
        "base_file_name": BASE_XLSX.name,
        "base_file_location_configured": bool(
            os.environ.get("DICAPRI_VALIDATION_BASE_XLSX") or os.environ.get("BASE_XLSX")
        ),
        "engines": {
            "v4": V4_SCRIPT.is_file(),
            "v5": V5_SCRIPT.is_file(),
            "sensitivity": SENSITIVITY_SCRIPT.is_file(),
        },
        "results_are_synthetic": True,
    }


@router.post("/run-v4", status_code=202)
def start_v4(background_tasks: BackgroundTasks):
    _check_ready()
    job_id = uuid.uuid4().hex
    folder = _job_dir(job_id)
    folder.mkdir(parents=True, exist_ok=True)
    _save_job(
        job_id,
        status="queued",
        stage="En espera de ejecución",
        progress=0,
        kind="v4",
        note="Generación sintética de escenarios y flujos; no es medición de planta.",
    )
    background_tasks.add_task(_background_v4, job_id)
    return _load_job(job_id)


@router.post("/run-v5", status_code=202)
def start_v5(background_tasks: BackgroundTasks):
    _check_ready()
    job_id = uuid.uuid4().hex
    folder = _job_dir(job_id)
    folder.mkdir(parents=True, exist_ok=True)
    _save_job(
        job_id,
        status="queued",
        stage="En espera de ejecución",
        progress=0,
        kind="v4_v5",
        note="Se ejecutarán V4, V5 y sensibilidad de supuestos utilizando los scripts versionados.",
    )
    background_tasks.add_task(_background_v5, job_id)
    return _load_job(job_id)


@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    return _load_job(job_id)


@router.get("/jobs/{job_id}/summary")
def get_job_summary(job_id: str):
    state = _load_job(job_id)
    if state.get("status") != "completed":
        raise HTTPException(status_code=409, detail="La ejecución todavía no ha finalizado.")
    folder = _job_dir(job_id)
    summaries: dict[str, list[dict[str, str]]] = {}
    for name in ("resumen_v5.csv", "recall_equilibrio.csv", "sensibilidad_supuestos.csv"):
        candidates = list(folder.rglob(name))
        if not candidates:
            continue
        with candidates[0].open("r", encoding="utf-8-sig", newline="") as file:
            summaries[name] = list(csv.DictReader(file))
    meta_file = folder / "salida_v5" / "version_v5.json"
    meta = json.loads(meta_file.read_text(encoding="utf-8")) if meta_file.is_file() else None
    return {"job": state, "version": meta, "tables": summaries}


@router.get("/jobs/{job_id}/files/{file_name:path}")
def download_job_file(job_id: str, file_name: str):
    if file_name not in ALLOWED_FILES:
        raise HTTPException(status_code=404, detail="Archivo no disponible.")
    folder = _job_dir(job_id)
    candidates = [
        folder / "salida_v4" / file_name,
        folder / "salida_v5" / file_name,
        folder / file_name,
    ]
    path = next((p for p in candidates if p.is_file()), None)
    if path is None:
        raise HTTPException(status_code=404, detail="El archivo no existe para esta ejecución.")
    return FileResponse(path, filename=Path(file_name).name, media_type="application/octet-stream")
