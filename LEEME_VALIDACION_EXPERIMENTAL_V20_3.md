# Dicapri V20.3 — Calibración exploratoria y sensibilidad

Conserva los modos de producción fija y horizonte fijo de V20.2. Añade controles editables de frecuencia de incidentes y porcentaje base de defectos, una calibración exploratoria de **solo frecuencia de incidentes** hacia la referencia histórica **reconstruida** de 3,08 %, y análisis de sensibilidad unifactorial de 12 escenarios con exportación CSV.

## Precauciones esenciales

- El 3,08 % es una referencia histórica reconstruida, no un patrón de verdad verificado para cada máquina.
- La calibración ajusta un parámetro para reproducir una tasa agregada. **No valida** estructura causal, mantenimiento, detección YOLO, IoT, Random Forest, tiempos reales ni paradas críticas.
- Los resultados son simulaciones sintéticas; la reducción no es evidencia empírica de efectividad en planta.
- Las tasas de defectos AS-IS y TO-BE deben analizarse en ambas modalidades. En horizonte fijo, más producción puede implicar más defectos absolutos.
- Los ciclos no equivalen a horas o días. No se han incorporado datos físicos nuevos.
- El análisis de sensibilidad varía un factor a la vez; no cubre todas las interacciones ni incertidumbre estructural.

## Procedimiento

1. `npm ci` y `npm run dev`.
2. En el panel V20.3, revisar frecuencia de incidentes y defecto base; elegir producción fija, 1200 medias y 30 réplicas.
3. Pulsar **Calibrar incidentes a 3,08 %**. Si el objetivo es inalcanzable, se informa sin modificar el parámetro.
4. Ejecutar réplicas y exportar CSV; repetir en horizonte fijo.
5. Pulsar **Analizar sensibilidad** y exportar el CSV de 12 escenarios.
6. Documentar fuente y calidad de cada parámetro antes de sustentar resultados.

La calibración se hace siempre sobre AS-IS de producción fija, incluso si el selector actual está en horizonte fijo. Para escenarios con >10000 ciclos/unidades no se ejecuta sensibilidad desde la interfaz por seguridad.
