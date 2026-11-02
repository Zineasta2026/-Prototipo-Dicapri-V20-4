# V18 — Control de recurrencia y mantenimiento basado en condición

## Qué cambia respecto de la V17

Se añade un panel en **Control de simulación → modo Autónomo** que registra las **últimas 24 inspecciones efectivas de YOLO** (no 24 ciclos esperados). Solo se alimenta cuando el backend devuelve una inspección válida. Las pruebas de confirmación post-mantenimiento y las prendas interrumpidas se excluyen de la ventana para no confundir inspecciones de producción con verificaciones.

- **0–2 defectos/24**: estable.
- **3–5 defectos/24**: advertencia.
- **6 o más defectos/24**: solicitud de parada e intervención dirigida según el defecto predominante.
- Se evalúa la ventana completa de 24 inspecciones antes de activar umbrales; una ventana incompleta se muestra como tal.
- Los umbrales son **hipótesis experimentales configurables en `src/recurrence.js`**, no límites reales validados por la empresa.
- Se preservan las paradas inmediatas, el control de dos defectos consecutivos, el estado de salud, AMEF/NPR y la reinspección de dos prendas de la V17.
- Al completar una intervención por recurrencia, se inicia una ventana nueva y se conserva el protocolo de verificación de dos prendas conformes.
- Se añaden campos de recurrencia a la exportación CSV de trazabilidad: tamaño de ventana, número de defectos, nivel y acción correctiva.

## Mantenimiento sugerido

- D01: inspección y sustitución de agujas dañadas.
- D03: revisión de alimentadores, guías, tensión y rotura de hilo.
- D04: revisión de disparador y alimentación del elástico.
- D06: revisión de lubricación, fugas y limpieza.
- D09: calibración de tensores y revisión de guiado y sincronización.

Las recomendaciones son hipótesis técnicas que requieren verificación por personal de mantenimiento. La parada y la reparación **son simuladas**, no actúan físicamente sobre una máquina.

## Cómo demostrar el nuevo panel

1. Instalar dependencias de frontend con `npm install` (o `npm ci`), si no están instaladas.
2. Iniciar backend como en V17 y ejecutar `npm run dev`.
3. Elegir **Autónomo**. Para la prueba rápida, mantener la simulación detenida y pulsar **Ensayar 8/24 (sintético)**.
4. Se carga una ventana de 24 observaciones de demostración con 8 defectos D09; aparece la parada simulada y una recomendación de mantenimiento.
5. Confirmar la intervención con el botón existente en el módulo híbrido; se reinicia la ventana y se conserva la verificación post-intervención.
6. Para ensayos reales de inferencia, iniciar modo autónomo con backend YOLO disponible y permitir que se completen 24 inspecciones.

**Importante:** el botón de ensayo NO añade 24 inspecciones falsas a la trazabilidad ni representa producción real. La muestra del ensayo solo demuestra la lógica del control.

## Limitaciones y pruebas

- El ZIP V18 conserva los modelos, imágenes y backend originales de V17.
- El paquete `dist` de V17 se retira porque no representa los cambios de V18; regenerarlo mediante `npm run build`.
- Se verificó sintaxis JavaScript y se ejecutaron pruebas unitarias del motor de recurrencia para 2, 3, 6 y 9 defectos, ventana incompleta y acción D06.
- **No se realizó una prueba completa de interfaz + backend** en este entorno: `npm ci --offline` no pudo recuperar Vite 8.3.0 de la caché. Validar localmente tras instalar dependencias.
- La lógica no demuestra todavía una reducción real de defectos. Para la tesis, contrastar escenarios comparables con/sin intervención, réplicas, tiempos de parada y supuestos de efectividad del mantenimiento.
