# Trazabilidad integral por ciclo — versión 9

Esta versión incorpora un expediente único para cada media producida durante el modo autónomo.

## Información registrada

- Identificador del ciclo (`MED-AAAAMMDD-0001`).
- Fecha y hora de inicio y fin.
- Máquina y escenario operativo.
- Tensión, RPM, vibración, temperatura, corriente y presencia de hilo.
- Nivel y confianza del Random Forest.
- Defecto esperado según la anomalía de proceso.
- Resultado, clases y confianza de YOLOv8n.
- Coincidencia entre la anomalía y el defecto visual.
- Código AMEF y NPR.
- Decisión, acción e intervención del operario.
- Duración del ciclo y de la intervención.

## Cómo probarlo

1. Iniciar FastAPI y Vite como en la versión anterior.
2. Seleccionar `Autónomo — ciclo híbrido`.
3. Mantener activada la inspección automática con YOLO.
4. Iniciar el ciclo autónomo.
5. Revisar el panel `10 — Trazabilidad integral por ciclo`.
6. Utilizar `Exportar trazabilidad por ciclo` para descargar el CSV.

Los registros se conservan en el almacenamiento local del navegador. El botón `Limpiar historial` elimina tanto los eventos como la trazabilidad.

## Correcciones adicionales

- Contraste corregido en las cuatro tarjetas de línea base del modo oscuro.
- Dominios temporales `.trycloudflare.com` autorizados en Vite.
