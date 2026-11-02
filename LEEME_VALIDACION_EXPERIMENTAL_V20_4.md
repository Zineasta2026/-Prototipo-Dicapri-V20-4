# V20.4 — Episodios de deterioro y mantenimiento

## Cambio principal
El motor de simulación ahora genera **episodios temporalmente correlacionados** de deterioro (normal, mixto y estrés crítico). En un episodio aumenta la probabilidad de defectos y, si persiste el desgaste, puede presentarse una parada crítica. AS-IS y TO-BE comparten sucesos aleatorios por índice de prenda. La intervención TO-BE puede resolver el episodio o fallar y generar recurrencia.

## Uso
1. Seleccionar escenario: habitual, mixto o estrés crítico.
2. Seleccionar producción fija (1.200 medias) o horizonte fijo (1.200 ciclos).
3. Ejecutar 30 réplicas y exportar el CSV.
4. Calibrar incidentes a 3,08 % **solo como ejercicio exploratorio**, en escenario mixto, producción fija; después conservar los parámetros al cambiar de modalidad.
5. Analizar sensibilidad y exportar el CSV.

## Limitaciones
- La tasa de 3,08 % es una referencia histórica **reconstruida**, no una validación independiente.
- Frecuencia, duración, severidad, transiciones de episodios, probabilidades de reparación y parada crítica son **supuestos sintéticos no calibrados**.
- El escenario crítico es una **prueba de estrés**, no una estimación de frecuencia anual.
- Los ciclos simulados no equivalen automáticamente a horas o días.
- La simulación experimental permanece separada del banco 3D y de las inferencias YOLO reales.
- No deben presentarse las reducciones simuladas como mejoras observadas en la empresa.
