# Dicapri V20 — Integración de escenarios y animaciones 3D

## Cambios
- Los selectores y controles del escenario se integran en el panel de Control de simulación; ya no existe un laboratorio independiente.
- El seguimiento de las fases y los resultados se ubica junto al banco experimental 3D principal.
- La ejecución de escenarios actualiza los estados visuales del banco 3D (operación, anomalía, parada, intervención y verificación).
- Los movimientos procedurales del operario distinguen inspección, tensión, agujas, hilo y limpieza; el jefe de planta inspecciona y señala, sin replicar el gesto del operario.
- Se mantienen los modos manuales, las funciones previas, las inspecciones YOLO y su historial. Los contadores de escenarios siguen siendo **sintéticos y separados** de las inspecciones reales.

## Limitaciones importantes
- Las acciones de mantenimiento y el efecto AS-IS/TO-BE siguen siendo ilustrativos; no prueban reducción industrial.
- La intervención exitosa o fallida aún se selecciona antes del escenario, no se infiere de mediciones posteriores.
- La integración comparte el banco 3D y los estados visuales, pero aún no constituye un motor físico único de simulación validado. Los KPI de YOLO no se mezclan con eventos sintéticos.
- Las animaciones son procedurales simplificadas, no capturas de movimiento humano.

## Instalación
1. Extraer el ZIP en una carpeta nueva.
2. Desde esa carpeta ejecutar `npm ci` (o `npm install` si fuera necesario).
3. Ejecutar `npm run dev` y abrir la URL local de Vite.
4. Para inspección real y modelos ML, iniciar también el backend según `INSTALACION_AUTONOMA.md`.

## Pruebas recomendadas
- Ejecutar `npm run build` en un equipo con dependencias instaladas.
- Comprobar selección manual de anomalías y que el escenario automático no se ejecute al mismo tiempo.
- Ejecutar escenario de 8/24 en automático y supervisado; verificar ambos personajes, parada y CSV.
- Comprobar gráficos, tema claro/oscuro, YOLO, AMEF y recurrencia.
