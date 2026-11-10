# Integración experimental V4/V5

Este módulo integra los scripts versionados V4 v1.2, V5 y sensibilidad de supuestos con FastAPI. El motor experimental se mantiene separado de los endpoints operativos YOLOv8n y Random Forest.

## Insumo local requerido

V4 calcula sus anclas a partir del archivo híbrido aprobado. Por seguridad y trazabilidad, el XLSX no se versiona en Git.

Coloque el archivo:

\`backend/data/BASE_DE_DATOS_DICAPRI_2025_HIBRIDA_v3.5.xlsx\`

o configure la variable de entorno \`DICAPRI_VALIDATION_BASE_XLSX\` con su ruta absoluta.

## Dependencias adicionales

Al instalar \`backend/requirements.txt\` se agregan SciPy y openpyxl para los cálculos y la lectura del XLSX.

## Endpoints

- \`GET /validation/config\`: verifica si están disponibles los motores y el XLSX.
- \`POST /validation/run-v4\`: ejecuta V4 en segundo plano.
- \`POST /validation/run-v5\`: ejecuta V4, V5 y sensibilidad en secuencia.
- \`GET /validation/jobs/{job_id}\`: consulta estado y progreso.
- \`GET /validation/jobs/{job_id}/summary\`: recupera las tablas resumidas al terminar.
- \`GET /validation/jobs/{job_id}/files/{file_name}\`: descarga resultados CSV/JSON/NPZ permitidos.

Los resultados se guardan en \`backend/data/validation_runs/{job_id}/\`, excluida de Git.

## Interpretación

TPR y FPR son parámetros barridos por V5 y no mediciones del rendimiento real de YOLO. Las corridas son sintéticas y no representan resultados industriales de Dicapri. El motor de validación no modifica ni reentrena YOLO o Random Forest.

## Ejecución local

Inicie FastAPI desde la carpeta \`backend\`, por ejemplo:

\`\`\`powershell
uvicorn api:app --host 127.0.0.1 --port 8000
\`\`\`

Compruebe primero \`GET /validation/config\`. La interfaz Vite accede a estos endpoints mediante el proxy local \`/api\`.
