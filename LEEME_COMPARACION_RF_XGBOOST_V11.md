# Comparación Random Forest vs. XGBoost — versión 11

Esta versión compara ambos clasificadores bajo las mismas condiciones y conserva **Random Forest** como modelo operativo del prototipo.

## Diseño de evaluación

- Entrenamiento: enero a septiembre de 2025 (270 registros).
- Validación: octubre de 2025 (30 registros).
- Prueba final: noviembre para predecir diciembre (30 registros).
- Validación cruzada temporal: cinco ventanas expansivas, sin mezclar meses futuros en el entrenamiento.
- Variable objetivo: riesgo del siguiente mes (`bajo`, `medio`, `alto`).

## Resultado principal

| Modelo | Accuracy prueba | Precision macro | Recall macro | F1 macro prueba | F1 temporal promedio |
|---|---:|---:|---:|---:|---:|
| Random Forest | 63.33 % | 71.73 % | 64.11 % | 64.42 % | 56.17 % |
| XGBoost | 53.33 % | 54.44 % | 52.32 % | 53.04 % | 52.14 % |

Random Forest fue seleccionado por obtener mayor F1 macro en prueba, mayor exactitud y mejor promedio temporal. Además, su entrenamiento fue más rápido para esta base pequeña.

## Archivos

- `ml_comparison/comparar_rf_xgboost.py`: entrenamiento reproducible.
- `ml_comparison/resultados/comparacion_modelos.json`: métricas completas, matrices de confusión e importancias.
- `ml_comparison/resultados/resumen_comparacion.csv`: resumen tabular.
- `ml_comparison/modelos/`: modelos generados por la comparación.
- `public/data/comparacion_modelos.json`: resultados mostrados en la interfaz.

## Volver a ejecutar en Windows

Desde la carpeta principal del proyecto:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install -r ".\ml_comparison\requirements.txt"
& ".\.venv\Scripts\python.exe" ".\ml_comparison\comparar_rf_xgboost.py"
```

Los resultados son preliminares porque proceden de una base reconstruida/sintética. No representan desempeño industrial validado.
