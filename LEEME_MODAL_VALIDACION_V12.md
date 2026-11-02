# Validación de modelos en segundo plano — versión 12

La comparación entre Random Forest y XGBoost fue retirada del flujo visual principal para evitar sobrecargar la interfaz.

En el panel de riesgo solo se muestra una franja compacta con:

- Modelo predictivo activo.
- Confirmación de que fue comparado con XGBoost.
- Botón **Ver validación de modelos**.

El botón abre una ventana interna con las métricas completas, la validación temporal y la justificación de selección. La ventana puede cerrarse mediante:

- El botón `×`.
- El botón **Cerrar**.
- Un clic en el fondo exterior.
- La tecla `Esc` del navegador.

El cambio es exclusivamente de presentación. No altera el entrenamiento, FastAPI, Random Forest, XGBoost, YOLO ni la simulación autónoma.
