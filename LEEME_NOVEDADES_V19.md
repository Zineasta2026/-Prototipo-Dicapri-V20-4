# DICAPRI V19 — Escenarios operativos y escalamiento visual

## Qué se agregó
- Laboratorio de escenarios con 7 situaciones productivas simuladas y modos automático/supervisado.
- Secuencia por fases: producción, advertencia, parada, operario, evaluación, jefe de planta (si falla primer nivel), verificación y resultados.
- Segundo personaje 3D diferenciado por uniforme naranja y casco blanco. Se desplaza a la máquina cuando se requiere escalamiento.
- Exportación CSV de eventos del laboratorio con etiqueta explícita de origen sintético.
- Comparación AS-IS / TO-BE **ilustrativa**, con supuestos transparentes; NO equivale a validación industrial.
- Selector de resultado de intervención de primer nivel (éxito / fracaso), para representar escalamiento sin atribuir diagnóstico real al software.

## Cómo probar
1. Instala dependencias siguiendo INSTALACION_AUTONOMA.md.
2. Ejecuta frontend y backend como en V18.
3. En Control de simulación abre «Laboratorio de escenarios · V19».
4. Selecciona escenario, resultado de operario y ejecución automática o supervisada.
5. Pulsa «Iniciar escenario» y observa el banco 3D en su sección existente. Para ver ambos personajes en simultáneo puede ser necesario desplazarse a la vista 3D.
6. Exporta el CSV. Las pruebas sintéticas no se insertan en el historial YOLO.

## Límites metodológicos
- Los escenarios y tiempos de fase son didácticos; no están calibrados con mediciones de máquina.
- El jefe de planta representa evaluación y coordinación; una reparación especializada requiere personal autorizado.
- La comparación numérica asume 8 defectos en cada lote de 24 sin intervención y 2 en el segundo lote con intervención eficaz: es un ejemplo hipotético, no evidencia de impacto.
- No hay integración física con la UNIPLET ANGE 12.2 ni control de seguridad real.
- El laboratorio está separado del motor de inspección V18 para no contaminar KPI e historial de producción.
