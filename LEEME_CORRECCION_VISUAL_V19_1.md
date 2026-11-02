# Dicapri V19.1 — Corrección visual del laboratorio de escenarios

## Problema corregido
El laboratorio V19 estaba anidado dentro del panel lateral de control (aprox. 250 px), provocando selectores, botones y textos ilegibles.

## Cambios
- Se trasladó el laboratorio a una sección de ancho completo inmediatamente después del panel de control y antes del banco 3D.
- Distribución en dos áreas: configuración (izquierda) y seguimiento/indicadores (derecha).
- Campos y botones ampliados, etiquetas legibles, indicadores reordenados.
- Enlace «Ver banco 3D» para desplazarse al modelo visual existente.
- Ajustes responsive y compatibilidad con modo claro/oscuro.
- Se conservaron los identificadores de controles y la lógica de escenarios V19 sin alterar las reglas experimentales.

## Prueba recomendada
1. Ejecutar los mismos archivos `.bat` habituales de la versión anterior.
2. Desplazarse hasta «Laboratorio de escenarios operativos».
3. Seleccionar «6 a 9 defectos por 24 medias», «Operario no resuelve → jefe de planta», «Supervisada por etapas».
4. Pulsar «Iniciar escenario» y avanzar por etapas.
5. Pulsar «Ver banco 3D» para observar la animación; revisar el panel de seguimiento y exportar CSV.

## Alcance y límites
Los escenarios siguen siendo demostraciones sintéticas. Esta versión corrige la interfaz, no implementa nuevas inferencias de YOLO ni valida una reducción industrial real. Se verificó sintaxis JS y estructura de controles; la compilación Vite no pudo completarse en este entorno por falta de dependencias instaladas.
