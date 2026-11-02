# V17 — Trazabilidad de la prenda afectada

Esta versión conserva la consecuencia de calidad de una parada crítica aun
después de que el operario haya reparado la máquina.

## Flujo corregido para la rotura de hilo

1. La rotura de hilo detiene la máquina y solicita intervención.
2. La media que estaba en proceso queda registrada como afectada y pendiente.
3. La intervención repara la máquina, pero no elimina el estado de la media.
4. Al reanudar, la media interrumpida termina y pasa automáticamente por YOLO.
5. La media se segrega por la interrupción del proceso, incluso si YOLO no
   confirma visualmente el defecto. El resultado real de YOLO se conserva para
   medir falsos negativos.
6. Después se exigen dos medias conformes consecutivas para liberar la
   producción.

En la demostración autónoma, una rotura de hilo compromete la media en el 90 %
de los casos. El 10 % restante representa una parada suficientemente temprana
como para no completar una prenda defectuosa.
