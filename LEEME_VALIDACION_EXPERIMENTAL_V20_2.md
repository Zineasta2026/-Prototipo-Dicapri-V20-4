# Dicapri V20.2 — Comparación con dos diseños experimentales

Se conserva el prototipo V20.1 y se actualiza exclusivamente el módulo de validación experimental.

## Modalidades

- **Producción fija:** cada política produce exactamente N medias. El tiempo total en ciclos puede ser diferente. Compare número absoluto de defectos, tasa de defectos, ciclos, paradas e inoperatividad.
- **Horizonte fijo:** cada política dispone de N ciclos; la producción final puede ser distinta. Compare productividad, defectos relativos, defectos absolutos, paradas e inoperatividad. Menor tasa de defectos no implica menor número absoluto.

Las dos políticas consumen los mismos sucesos aleatorios **por unidad fabricada**. Los ciclos de inoperatividad no consumen sucesos productivos. Los escenarios son sintéticos, no un gemelo digital validado. La duración de parada crítica se mide en ciclos, no en horas o días.

## Cambios

- Selector de modalidad y etiqueta dinámica de unidades/ciclos.
- Motor de simulación con control de horizonte fijo o unidades fijas.
- Resultados ampliados: tasas, unidades, defectos absolutos, tiempo total, paradas, inoperatividad, intervalo normal aproximado del 95 %.
- CSV por modalidad con datos pareados, ciclos totales y parámetros.
- Validación de campos y exportación desactivada al cambiar de modalidad.

## Interpretación y limitaciones

Las probabilidades de anomalías, deterioro, recuperación y eficacia del mantenimiento son supuestos exploratorios. Las corridas NO validan el efecto real del prototipo en Textiles Dicapri. Antes de usarlas como evidencia, calibrar y justificar parámetros con datos auténticos y efectuar análisis de sensibilidad. No confundir los ciclos con horas o días. La simulación sigue separada del banco 3D, YOLO, Random Forest y AMEF.

## Instalación

Extraer el ZIP en carpeta nueva, ejecutar `npm ci` y `npm run dev`. Ejecutar `npm run build` para verificar compilación local. Backend YOLO sin modificaciones.

## Pruebas realizadas

- `node --check` en los dos módulos JS modificados.
- 30 réplicas de producción fija y horizonte fijo, con resultados reproducibles por semilla.
- Todas las corridas completaron los horizontes previstos.
- No se ejecutó prueba de interfaz en navegador ni compilación completa Vite en este entorno.
