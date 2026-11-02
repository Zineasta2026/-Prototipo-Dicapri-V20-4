# Modo de demostración de criticidad — V13

Esta versión incorpora una prueba controlada para demostrar cómo el prototipo
reconoce la recurrencia y severidad de anomalías hasta recomendar mantenimiento.

## Cómo ejecutarla

1. Iniciar FastAPI y Vite de la misma manera que en la versión anterior.
2. En **Modo de operación**, seleccionar **Autónomo**.
3. En **Frecuencia de anomalías**, seleccionar
   **Criticidad — degradación controlada**.
4. Mantener activadas la inspección YOLO y la intervención automática.
5. Presionar **Iniciar ciclo autónomo**.

El intervalo cambia automáticamente a 8 segundos para agilizar la exposición.

## Secuencia controlada

La secuencia combina ciclos normales con rotura de hilo, atascamiento, rotura
de aguja y falla del disparador. Después de cada intervención se conservan los
ciclos de validación mediante YOLO.

## Indicadores

- Salud de la máquina, inicialmente 100 %.
- Número de eventos severos y críticos.
- Estado: estable, bajo observación, programar mantenimiento o mantenimiento
  requerido.
- Recomendación operativa.

Al alcanzar dos eventos críticos, la máquina queda bloqueada aunque finalice
la corrección puntual. Esto representa que la recurrencia exige mantenimiento
antes de continuar. El botón **Restablecer** reinicia la demostración.

Este modo es una prueba acelerada y controlada; no representa la frecuencia
operativa real de la empresa.
