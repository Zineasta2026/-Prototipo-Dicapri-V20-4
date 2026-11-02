# Dicapri V20.1 — Primer módulo experimental reproducible

Se conserva íntegra la V20 y se incorpora al final de la interfaz un panel **separado** de experimentación AS-IS/TO-BE.

- Motor independiente `src/validation-engine.js`, con generador pseudoaleatorio reproducible y corridas pareadas.
- Controles: unidades, réplicas, semilla, umbral de defectos en ventana de 24, eficacia del operario y del jefe, duración de parada crítica.
- Indicadores por política: defectos, porcentaje, paradas críticas, ciclos inoperativos; para TO-BE, intervenciones y escalamientos.
- Resumen con reducción relativa e intervalo aproximado de confianza del 95 % para diferencias pareadas.
- Exportación CSV de cada réplica con parámetros y etiqueta de procedencia sintética.

## Advertencias científicas

**No es una validación industrial ni una calibración empírica.** Los parámetros por defecto son exploratorios, NO estimaciones de la empresa. La duración de parada crítica se expresa en ciclos simulados, no en días ni horas. No se han verificado las relaciones causales con registros reales. La simulación usa el mismo flujo de sucesos aleatorios por pareja, pero las políticas consumen tiempos de parada distintos. Los resultados dependen del modelo y no demuestran reducción real en Dicapri.

**Alcance:** Esta versión incorpora el primer módulo de experimentación y exportación, pero **todavía no integra un motor físico único con el banco 3D, YOLO, Random Forest ni AMEF**. No se han modificado los escenarios didácticos V20 preexistentes. Los contadores de imágenes reales siguen separados de los sintéticos.

## Instalación

Extraer el ZIP en carpeta nueva. Ejecutar `npm ci` y `npm run dev`. Para comprobar compilación, ejecutar `npm run build`. El backend YOLO conserva sus instrucciones de `INSTALACION_AUTONOMA.md`.
