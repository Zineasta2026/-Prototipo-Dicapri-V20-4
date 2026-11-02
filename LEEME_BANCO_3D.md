# Banco experimental 3D

Esta versión incorpora una representación tridimensional referencial de la
máquina circular **UNIPLET ANGE 12.2**. El modelo fue construido con Three.js a
partir de las fotografías proporcionadas; no pretende sustituir un modelo CAD
con medidas de ingeniería.

## Ejecución

Desde PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Abra la dirección que muestra Vite en la terminal.

## Comportamiento integrado

- El cabezal, los alimentadores y las guías se animan según las RPM simuladas.
- Las luces pasan a verde, amarillo o rojo según el escenario operativo.
- La ausencia de hilo oculta su recorrido en el modelo.
- Una vibración crítica produce una oscilación visible de la máquina.
- La vista se gira arrastrando y se acerca con la rueda del ratón.

El banco 3D se presenta en una sección independiente situada debajo del banco
funcional, por lo que no modifica la distribución de sensores, diagnóstico ni
acciones.

## Automatización híbrida

El modo autónomo coordina el siguiente flujo:

1. Producción y supervisión mediante sensores virtuales.
2. Evaluación de riesgo mediante Random Forest.
3. Inspección automática con YOLO de las fotografías seleccionadas como lote.
4. Decisión conjunta con la criticidad AMEF.
5. Continuación, segregación o parada automática simulada.

Las roturas de hilo y los atascamientos detienen el ciclo inmediatamente. Una
posible rotura de aguja no detiene por sí sola la máquina: el ciclo termina y la
media pasa a inspección visual. Después de una parada, el reinicio permanece
bloqueado hasta confirmar la intervención. La liberación requiere dos medias
conformes consecutivas.

Por restricciones de seguridad del navegador, las fotografías deben
seleccionarse una vez al inicio. Después, el sistema las procesa de forma
consecutiva y automática, sin volver a pulsar el botón de análisis.
