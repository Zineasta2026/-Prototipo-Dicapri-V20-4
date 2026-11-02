# Selector de modo claro y oscuro

Esta versión incorpora un botón de tema en la cabecera de la interfaz.

## Funcionamiento

- En modo claro, el botón indica `Modo oscuro` porque esa es la acción disponible.
- En modo oscuro, el botón indica `Modo claro`.
- La selección se guarda en el navegador y permanece después de recargar la página.
- Los gráficos, las tarjetas, el historial y el banco 3D adaptan sus colores automáticamente.

## Archivos modificados

- `src/main.js`
- `src/style.css`
- `src/machine3d.js`

## Inicio habitual

El procedimiento de inicio de FastAPI, Vite y Cloudflare Tunnel no cambia.
