# Dicapri V19.2 — Optimización del espacio del banco 2D

Esta actualización parte de la V19.1 y corrige exclusivamente la disposición visual.

## Cambios
- El grid principal utiliza `align-items: start`, para que el panel central no se estire hasta igualar la altura de los controles laterales.
- Se elimina el `min-height` forzado de las tres columnas del dashboard.
- La tarjeta de recurrencia conserva sus indicadores, umbrales, ensayo sintético y limpieza, pero presenta un resumen compacto.
- El diagnóstico, las acciones y las advertencias siguen disponibles en «Ver diagnóstico y detalles». Los identificadores de elementos y las funciones JS se conservan.
- No se modificaron los algoritmos de YOLO, Random Forest, escenarios V19, animaciones 3D ni el backend.

## Prueba recomendada
1. Inicia la interfaz como de costumbre.
2. Comprueba que el banco 2D termina cerca de su contenido y que no existe el gran espacio blanco provocado por el panel lateral.
3. Despliega «Ver diagnóstico y detalles» y ejecuta «Ensayar 8/24».
4. Comprueba el laboratorio de escenarios y la animación de escalamiento al jefe de planta.

## Limitaciones
Esta es una corrección visual. Los resultados de simulación siguen siendo sintéticos y no constituyen evidencia de reducción industrial.
